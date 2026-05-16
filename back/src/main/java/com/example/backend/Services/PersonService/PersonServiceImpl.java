package com.example.backend.Services.PersonService;

import com.example.backend.Payload.req.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonServiceImpl implements PersonService {

    private final JdbcTemplate jdbc;
    private final Map<String, Boolean> columnExistsCache = new ConcurrentHashMap<>();

    @Override
    public HttpEntity<?> getAll(Integer orgId,
                                Boolean isClient,
                                Boolean active,
                                Boolean isExpired,
                                Boolean hasAccessCount,
                                Integer trainerId,
                                String search,
                                int page,
                                int limit) {

        int safePage = Math.max(page, 1);
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        Boolean clientFilter = (isClient == null) ? Boolean.TRUE : isClient;

        if (search != null && !search.isBlank() && search.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "search kamida 3 ta belgidan iborat bo'lishi kerak"
            ));
        }

        StringBuilder where = new StringBuilder(" WHERE p.organization_id = ? AND p.deleted = false ");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (hasColumn("persons", "is_staff")) {
            where.append(" AND p.is_staff = ? ");
            params.add(!clientFilter);
        }

        if (active != null) {
            where.append(" AND p.active = ? ");
            params.add(active);
        }

        if (isExpired != null && hasColumn("persons", "subscription_end")) {
            if (Boolean.TRUE.equals(isExpired)) {
                where.append(" AND p.subscription_end IS NOT NULL AND p.subscription_end < CURRENT_DATE ");
            } else {
                where.append(" AND (p.subscription_end IS NULL OR p.subscription_end >= CURRENT_DATE) ");
            }
        }

        if (hasAccessCount != null && hasColumn("persons", "access_count")) {
            where.append(Boolean.TRUE.equals(hasAccessCount)
                    ? " AND COALESCE(p.access_count, 0) > 0 "
                    : " AND COALESCE(p.access_count, 0) = 0 ");
        }

        if (trainerId != null && hasColumn("persons", "trainer_id")) {
            where.append(" AND p.trainer_id = ? ");
            params.add(trainerId);
        }

        if (search != null && !search.isBlank()) {
            where.append(" AND (p.full_name ILIKE ? ");
            params.add("%" + search.trim() + "%");
            if (hasColumn("persons", "phone_number")) {
                where.append(" OR p.phone_number ILIKE ? ");
                params.add("%" + search.trim() + "%");
            }
            where.append(") ");
        }

        Long totalCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM persons p " + where,
                Long.class,
                params.toArray()
        );

        String selectSql = "SELECT p.id, " +
                "p.full_name AS fullname, " +
                "p.photo_url AS photoUrl, " +
                colOr("persons", "phone_number", "p.phone_number", "NULL", "phoneNumber") + ", " +
                colOr("persons", "gender", "p.gender", "NULL", "gender") + ", " +
                colOr("persons", "birth_date", "p.birth_date", "NULL", "birthDate") + ", " +
                colOr("persons", "location", "p.location", "NULL", "location") + ", " +
                colOr("persons", "graphic_id", "p.graphic_id", "NULL", "graphicId") + ", " +
                "p.active, " +
                (hasColumn("persons", "is_staff") ? "(NOT p.is_staff)" : "true") + " AS isClient, " +
                colOr("persons", "subscription_end", "p.subscription_end", "NULL", "subscriptionEndDate") + ", " +
                colOr("persons", "access_count", "p.access_count", "0", "accessCount") + ", " +
                colOr("persons", "debt", "p.debt", "0", "debt") + ", " +
                colOr("persons", "trainer_id", "p.trainer_id", "NULL", "trainerId") + ", " +
                (hasColumn("persons", "created_time") ? "p.created_time" : "p.created_at") + " AS createdTime " +
                "FROM persons p " + where +
                " ORDER BY " + (hasColumn("persons", "created_time") ? "p.created_time" : "p.created_at") + " DESC " +
                " LIMIT ? OFFSET ?";

        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(safeLimit);
        pageParams.add((safePage - 1L) * safeLimit);

        List<Map<String, Object>> data = jdbc.query(selectSql, (rs, rowNum) -> mapPersonRow(rs), pageParams.toArray());
        long safeTotal = totalCount == null ? 0L : totalCount;

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", safeTotal,
                "page", safePage,
                "limit", safeLimit,
                "totalPages", (int) Math.ceil(safeTotal / (double) safeLimit)
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        List<Map<String, Object>> personRows = jdbc.query(
                "SELECT p.id, p.full_name AS fullname, p.photo_url AS photoUrl, " +
                        colOr("persons", "phone_number", "p.phone_number", "NULL", "phoneNumber") + ", " +
                        colOr("persons", "subscription_end", "p.subscription_end", "NULL", "subscriptionEndDate") + ", " +
                        colOr("persons", "access_count", "p.access_count", "0", "accessCount") + ", " +
                        colOr("persons", "debt", "p.debt", "0", "debt") + " " +
                        "FROM persons p WHERE p.id=? AND p.organization_id=? AND p.deleted=false",
                (rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("fullname", rs.getString("fullname"));
                    item.put("photoUrl", rs.getString("photoUrl"));
                    item.put("phoneNumber", rs.getString("phoneNumber"));
                    item.put("subscriptionEndDate", getString(rs, "subscriptionEndDate"));
                    item.put("accessCount", getInt(rs, "accessCount"));
                    item.put("debt", getBigDecimal(rs, "debt"));
                    return item;
                },
                id, orgId
        );

        if (personRows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        String paymentTimeCol = hasColumn("payments", "created_time") ? "created_time" : "payment_date";
        String paymentTypeExpr = hasColumn("payments", "payment_type") ? "p.payment_type" : "'income'";
        String categoryExpr = hasColumn("payments", "category")
                ? "p.category"
                : (hasColumn("payments", "category_id") ? "COALESCE(c.name_uz, 'zal')" : "'zal'");

        String paymentSql = "SELECT p.id, " + categoryExpr + " AS category, " +
                "COALESCE(" + (hasColumn("payments", "price") ? "p.price" : "p.amount") + ",0) AS price, " +
                paymentTypeExpr + " AS paymentType, p." + paymentTimeCol + " AS createdTime " +
                "FROM payments p " +
                (hasColumn("payments", "category_id") ? "LEFT JOIN categories c ON c.id = p.category_id " : "") +
                "WHERE p.organization_id=? AND p.person_id=? " +
                "ORDER BY p." + paymentTimeCol + " DESC LIMIT 10";

        List<Map<String, Object>> recentPayments = jdbc.query(paymentSql, (rs, rowNum) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", rs.getLong("id"));
            item.put("category", rs.getString("category"));
            item.put("price", getBigDecimal(rs, "price"));
            item.put("paymentType", rs.getString("paymentType"));
            item.put("createdTime", getString(rs, "createdTime"));
            return item;
        }, orgId, id);

        List<Map<String, Object>> recentEvents = jdbc.query(
                "SELECT e.id, e.direction, e.entry_time, COALESCE(t.name, 'Kirish') AS terminal_name " +
                        "FROM entries e " +
                        "LEFT JOIN terminals t ON t.id = e.terminal_id " +
                        "WHERE e.organization_id=? AND e.person_id=? " +
                        "ORDER BY e.entry_time DESC LIMIT 10",
                (rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("type", "IN".equalsIgnoreCase(rs.getString("direction")) ? "enter" : "exit");
                    item.put("datetime", getString(rs, "entry_time"));
                    item.put("terminalName", rs.getString("terminal_name"));
                    return item;
                },
                orgId, id
        );

        return ResponseEntity.ok(Map.of(
                "person", personRows.get(0),
                "recentPayments", recentPayments,
                "recentEvents", recentEvents
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, PersonCreateRequest request) {
        if (request.getFullname() == null || request.getFullname().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "fullname majburiy"));
        }

        List<String> cols = new ArrayList<>(List.of("organization_id", "full_name", "photo_url", "active", "deleted", "created_at"));
        List<Object> vals = new ArrayList<>(List.of(orgId, request.getFullname(), request.getPhotoUrl(),
                request.getActive() == null || request.getActive(), false, LocalDateTime.now()));

        addIfColumn(cols, vals, "phone_number", request.getPhoneNumber());
        addIfColumn(cols, vals, "gender", request.getGender());
        addIfColumn(cols, vals, "birth_date", request.getBirthDate());
        addIfColumn(cols, vals, "location", request.getLocation());
        addIfColumn(cols, vals, "graphic_id", request.getGraphicId());
        addIfColumn(cols, vals, "is_staff", request.getIsClient() != null ? !request.getIsClient() : false);
        addIfColumn(cols, vals, "created_time", LocalDateTime.now());

        String placeholders = String.join(",", Collections.nCopies(cols.size(), "?"));
        String sql = "INSERT INTO persons(" + String.join(",", cols) + ") VALUES(" + placeholders + ") RETURNING id";
        Long personId = jdbc.queryForObject(sql, Long.class, vals.toArray());

        if (personId == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Shaxs yaratilmadi"));
        }

        createPersonTask(orgId, personId, "add");
        createPersonTask(orgId, personId, "photo");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", personId,
                "message", "Shaxs muvaffaqiyatli yaratildi va terminallarga yuklandi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, PersonUpdateRequest request) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        StringBuilder set = new StringBuilder("full_name = COALESCE(?, full_name), active = COALESCE(?, active)");
        List<Object> params = new ArrayList<>(List.of(request.getFullname(), request.getActive()));

        if (hasColumn("persons", "phone_number")) {
            set.append(", phone_number = COALESCE(?, phone_number)");
            params.add(request.getPhoneNumber());
        }
        if (hasColumn("persons", "gender")) {
            set.append(", gender = COALESCE(?, gender)");
            params.add(request.getGender());
        }
        if (hasColumn("persons", "birth_date")) {
            set.append(", birth_date = COALESCE(?, birth_date)");
            params.add(request.getBirthDate());
        }
        if (hasColumn("persons", "location")) {
            set.append(", location = COALESCE(?, location)");
            params.add(request.getLocation());
        }
        if (hasColumn("persons", "graphic_id")) {
            set.append(", graphic_id = COALESCE(?, graphic_id)");
            params.add(request.getGraphicId());
        }
        if (hasColumn("persons", "updated_time")) {
            set.append(", updated_time = NOW()");
        }

        params.add(id);
        params.add(orgId);
        jdbc.update("UPDATE persons SET " + set + " WHERE id=? AND organization_id=? AND deleted=false", params.toArray());

        createPersonTask(orgId, id, "update");
        return ResponseEntity.ok(Map.of("message", "Shaxs muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        jdbc.update("UPDATE persons SET deleted=true, active=false WHERE id=? AND organization_id=?", id, orgId);

        if (hasColumn("payments", "deleted")) {
            jdbc.update("UPDATE payments SET deleted=true WHERE person_id=? AND organization_id=?", id, orgId);
        } else {
            jdbc.update("DELETE FROM payments WHERE person_id=? AND organization_id=?", id, orgId);
        }

        createPersonTask(orgId, id, "delete");
        return ResponseEntity.ok(Map.of("message", "Shaxs muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> updatePhoto(Integer orgId, Long id, PersonPhotoUpdateRequest request) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }
        jdbc.update("UPDATE persons SET photo_url=? WHERE id=? AND organization_id=?", request.getPhotoUrl(), id, orgId);
        createPersonTask(orgId, id, "photo");
        return ResponseEntity.ok(Map.of("message", "Rasm muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> extendSubscription(Integer orgId, Long id, PersonExtendSubscriptionRequest request) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        BigDecimal price = nvl(request.getPrice());
        BigDecimal paidAmount = nvl(request.getPaidAmount());
        BigDecimal addedDebt = price.subtract(paidAmount).max(BigDecimal.ZERO);
        BigDecimal oldDebt = personDebt(orgId, id);
        BigDecimal newDebt = oldDebt.add(addedDebt);

        List<Object> updateParams = new ArrayList<>();
        StringBuilder set = new StringBuilder();

        if (hasColumn("persons", "subscription_end")) {
            set.append("subscription_end = ?, ");
            updateParams.add(request.getEndDate());
        }
        if (hasColumn("persons", "access_count")) {
            set.append("access_count = COALESCE(?, access_count), ");
            updateParams.add(request.getAccessCount());
        }
        if (hasColumn("persons", "debt")) {
            set.append("debt = ?, ");
            updateParams.add(newDebt);
        }

        if (set.length() == 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Obuna maydonlari mavjud emas"));
        }

        set.setLength(set.length() - 2);
        updateParams.add(id);
        updateParams.add(orgId);
        jdbc.update("UPDATE persons SET " + set + " WHERE id=? AND organization_id=? AND deleted=false", updateParams.toArray());

        insertPayment(orgId, id, "zal", "expense", price, "Obuna narxi");
        insertPayment(orgId, id, "zal", "income", paidAmount, "Obuna to'lovi");

        createPersonTask(orgId, id, "update");

        return ResponseEntity.ok(Map.of(
                "message", "Obuna muvaffaqiyatli uzaytirildi",
                "endDate", request.getEndDate(),
                "accessCount", request.getAccessCount(),
                "debt", newDebt
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> payDebt(Integer orgId, Long id, PersonDebtPayRequest request) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        BigDecimal amount = nvl(request.getAmount());
        String category = (request.getCategory() == null || request.getCategory().isBlank()) ? "zal" : request.getCategory();
        insertPayment(orgId, id, category, "income", amount, "Qarz to'lovi");

        return ResponseEntity.ok(Map.of(
                "message", "Qarz muvaffaqiyatli to'landi",
                "paidAmount", amount,
                "remainingDebt", personDebt(orgId, id)
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> clearAllDebts(Integer orgId, Long id) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        if (hasColumn("persons", "debt")) {
            jdbc.update("UPDATE persons SET debt=0 WHERE id=? AND organization_id=?", id, orgId);
        }
        if (hasColumn("payments", "is_important")) {
            jdbc.update("UPDATE payments SET is_important=false WHERE person_id=? AND organization_id=?", id, orgId);
        }

        return ResponseEntity.ok(Map.of("message", "Barcha qarzlar muvaffaqiyatli tozalandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> assignTrainer(Integer orgId, Long id, PersonAssignTrainerRequest request) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }
        if (!hasColumn("persons", "trainer_id")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "trainer_id ustuni mavjud emas"));
        }

        jdbc.update("UPDATE persons SET trainer_id=? WHERE id=? AND organization_id=?", request.getTrainerId(), id, orgId);
        return ResponseEntity.ok(Map.of("message", "Murabbiy muvaffaqiyatli biriktirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> refreshInFaceID(Integer orgId, Long id) {
        if (!personExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        createPersonTask(orgId, id, "delete");
        createPersonTask(orgId, id, "add");
        createPersonTask(orgId, id, "photo");

        return ResponseEntity.ok(Map.of("message", "Mijoz barcha terminallarda yangilandi"));
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId, Boolean isClient) {
        Boolean clientFilter = (isClient == null) ? Boolean.TRUE : isClient;
        String where = " WHERE p.organization_id = ? AND p.deleted = false ";
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (hasColumn("persons", "is_staff")) {
            where += " AND p.is_staff = ? ";
            params.add(!clientFilter);
        }

        List<Map<String, Object>> rows = jdbc.query(
                "SELECT p.id, p.full_name, p.photo_url, p.active, " +
                        colOr("persons", "phone_number", "p.phone_number", "NULL", "phone_number") + ", " +
                        colOr("persons", "debt", "p.debt", "0", "debt") + ", " +
                        colOr("persons", "subscription_end", "p.subscription_end", "NULL", "subscription_end") +
                        " FROM persons p " + where +
                        " ORDER BY p.id DESC",
                (rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("full_name", rs.getString("full_name"));
                    item.put("phone_number", rs.getString("phone_number"));
                    item.put("photo_url", rs.getString("photo_url"));
                    item.put("active", rs.getBoolean("active"));
                    item.put("subscription_end", getString(rs, "subscription_end"));
                    item.put("debt", getBigDecimal(rs, "debt"));
                    return item;
                },
                params.toArray()
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Persons");
            String[] cols = {"ID", "Fullname", "Phone", "Active", "Subscription End", "Debt"};
            Row header = sheet.createRow(0);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
            }

            int idx = 1;
            for (Map<String, Object> row : rows) {
                Row r = sheet.createRow(idx++);
                r.createCell(0).setCellValue(((Number) row.get("id")).longValue());
                r.createCell(1).setCellValue(Objects.toString(row.get("full_name"), ""));
                r.createCell(2).setCellValue(Objects.toString(row.get("phone_number"), ""));
                r.createCell(3).setCellValue(Boolean.TRUE.equals(row.get("active")) ? "Ha" : "Yo'q");
                r.createCell(4).setCellValue(Objects.toString(row.get("subscription_end"), ""));
                r.createCell(5).setCellValue(Objects.toString(row.get("debt"), "0"));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "persons_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            workbook.write(Files.newOutputStream(filePath));

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));

        } catch (Exception e) {
            log.error("Excel yaratishda xato", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private Map<String, Object> mapPersonRow(ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("fullname", rs.getString("fullname"));
        row.put("photoUrl", rs.getString("photoUrl"));
        row.put("phoneNumber", rs.getString("phoneNumber"));
        row.put("gender", rs.getString("gender"));
        row.put("birthDate", getString(rs, "birthDate"));
        row.put("location", rs.getString("location"));
        row.put("graphicId", getInt(rs, "graphicId"));
        row.put("active", rs.getBoolean("active"));
        row.put("isClient", rs.getBoolean("isClient"));
        row.put("subscriptionEndDate", getString(rs, "subscriptionEndDate"));
        row.put("accessCount", getInt(rs, "accessCount"));
        row.put("debt", getBigDecimal(rs, "debt"));
        row.put("trainerId", getInt(rs, "trainerId"));
        row.put("createdTime", getString(rs, "createdTime"));
        return row;
    }

    private String getString(ResultSet rs, String column) throws java.sql.SQLException {
        Object obj = rs.getObject(column);
        return obj == null ? null : obj.toString();
    }

    private Integer getInt(ResultSet rs, String column) throws java.sql.SQLException {
        Object obj = rs.getObject(column);
        return obj == null ? null : ((Number) obj).intValue();
    }

    private BigDecimal getBigDecimal(ResultSet rs, String column) throws java.sql.SQLException {
        BigDecimal v = rs.getBigDecimal(column);
        return v == null ? BigDecimal.ZERO : v;
    }

    private BigDecimal nvl(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }

    private boolean personExists(Integer orgId, Long personId) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM persons WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                personId, orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private BigDecimal personDebt(Integer orgId, Long personId) {
        if (!hasColumn("persons", "debt")) return BigDecimal.ZERO;
        BigDecimal debt = jdbc.queryForObject(
                "SELECT COALESCE(debt, 0) FROM persons WHERE id=? AND organization_id=?",
                BigDecimal.class,
                personId, orgId
        );
        return debt == null ? BigDecimal.ZERO : debt;
    }

    private void createPersonTask(Integer orgId, Long personId, String action) {
        try {
            jdbc.update("SELECT create_person_tasks(?, ?, ?)", orgId, personId, action);
        } catch (Exception e) {
            log.warn("create_person_tasks ishlamadi (orgId={}, personId={}, action={}): {}",
                    orgId, personId, action, e.getMessage());
        }
    }

    private void insertPayment(Integer orgId,
                               Long personId,
                               String category,
                               String paymentType,
                               BigDecimal amount,
                               String description) {
        List<String> cols = new ArrayList<>(List.of("organization_id", "person_id"));
        List<Object> vals = new ArrayList<>(List.of(orgId, personId));

        if (hasColumn("payments", "category")) {
            cols.add("category");
            vals.add(category);
        } else if (hasColumn("payments", "category_id")) {
            cols.add("category_id");
            vals.add(null);
        }

        if (hasColumn("payments", "payment_type")) {
            cols.add("payment_type");
            vals.add(paymentType);
        }
        if (hasColumn("payments", "price")) {
            cols.add("price");
            vals.add(amount);
        }
        if (hasColumn("payments", "amount")) {
            cols.add("amount");
            vals.add(amount);
        }
        if (hasColumn("payments", "description")) {
            cols.add("description");
            vals.add(description);
        }
        if (hasColumn("payments", "is_important")) {
            cols.add("is_important");
            vals.add(true);
        }
        if (hasColumn("payments", "created_time")) {
            cols.add("created_time");
            vals.add(LocalDateTime.now());
        }
        if (hasColumn("payments", "payment_date")) {
            cols.add("payment_date");
            vals.add(LocalDateTime.now());
        }

        String placeholders = String.join(",", Collections.nCopies(cols.size(), "?"));
        jdbc.update("INSERT INTO payments(" + String.join(",", cols) + ") VALUES(" + placeholders + ")", vals.toArray());
    }

    private boolean hasColumn(String table, String column) {
        String key = table + "." + column;
        return columnExistsCache.computeIfAbsent(key, k -> {
            try {
                Boolean exists = jdbc.queryForObject(
                        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?)",
                        Boolean.class,
                        table, column
                );
                return Boolean.TRUE.equals(exists);
            } catch (Exception e) {
                return false;
            }
        });
    }

    private void addIfColumn(List<String> cols, List<Object> vals, String column, Object value) {
        if (hasColumn("persons", column)) {
            cols.add(column);
            vals.add(value);
        }
    }

    private String colOr(String table, String column, String existingExpr, String fallbackExpr, String alias) {
        return (hasColumn(table, column) ? existingExpr : fallbackExpr) + " AS " + alias;
    }
}

