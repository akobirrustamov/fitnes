package com.example.backend.Services.PaymentsService;

import com.example.backend.Payload.req.PaymentCreateRequest;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentsServiceImpl implements PaymentsService {

    private final JdbcTemplate jdbc;
    private final Map<String, Boolean> columnExistsCache = new ConcurrentHashMap<>();

    @Override
    public HttpEntity<?> getAll(Integer orgId,
                                Long personId,
                                String category,
                                String paymentType,
                                Boolean isImportant,
                                int page,
                                int limit) {

        int safePage = Math.max(1, page);
        int safeLimit = Math.min(500, Math.max(1, limit));

        QueryData q = buildWhere(orgId, personId, category, paymentType, isImportant);

        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM payments p " + q.where, Long.class, q.params.toArray());

        List<Object> listParams = new ArrayList<>(q.params);
        listParams.add(safeLimit);
        listParams.add((safePage - 1L) * safeLimit);

        String categoryExpr = hasColumn("payments", "category")
                ? "p.category"
                : (hasColumn("payments", "category_id") ? "COALESCE(c.name_uz, c.nameUz, '')" : "''");
        String priceExpr = "COALESCE(" + (hasColumn("payments", "price") ? "p.price" : "NULL") + ", " +
                (hasColumn("payments", "amount") ? "p.amount" : "0") + ")";
        String paymentTypeExpr = hasColumn("payments", "payment_type") ? "p.payment_type" : "'income'";
        String importantExpr = hasColumn("payments", "is_important") ? "p.is_important" : "true";
        String createdExpr = hasColumn("payments", "created_time") ? "p.created_time" : "p.payment_date";

        String sql = "SELECT p.id, p.person_id, per.full_name AS person_name, " +
                categoryExpr + " AS category, p.description, " +
                priceExpr + " AS price, " +
                paymentTypeExpr + " AS payment_type, " +
                importantExpr + " AS is_important, " +
                createdExpr + " AS created_time " +
                "FROM payments p " +
                "LEFT JOIN persons per ON per.id = p.person_id " +
                (hasColumn("payments", "category_id") ? "LEFT JOIN categories c ON c.id = p.category_id " : "") +
                q.where +
                " ORDER BY " + createdExpr + " DESC LIMIT ? OFFSET ?";

        List<Map<String, Object>> data = jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("personId", rs.getObject("person_id") == null ? null : rs.getLong("person_id"));
            row.put("personName", rs.getString("person_name"));
            row.put("category", rs.getString("category"));
            row.put("description", rs.getString("description"));
            row.put("price", rs.getBigDecimal("price"));
            row.put("paymentType", rs.getString("payment_type"));
            row.put("isImportant", rs.getBoolean("is_important"));
            Object created = rs.getObject("created_time");
            row.put("createdTime", created == null ? null : created.toString());
            return row;
        }, listParams.toArray());

        long safeTotal = total == null ? 0L : total;
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
        QueryData q = new QueryData();
        q.where = " WHERE p.organization_id=? AND p.id=? ";
        q.params.add(orgId);
        q.params.add(id);

        String categoryExpr = hasColumn("payments", "category")
                ? "p.category"
                : (hasColumn("payments", "category_id") ? "COALESCE(c.name_uz, c.nameUz, '')" : "''");
        String priceExpr = "COALESCE(" + (hasColumn("payments", "price") ? "p.price" : "NULL") + ", " +
                (hasColumn("payments", "amount") ? "p.amount" : "0") + ")";
        String paymentTypeExpr = hasColumn("payments", "payment_type") ? "p.payment_type" : "'income'";
        String importantExpr = hasColumn("payments", "is_important") ? "p.is_important" : "true";
        String createdExpr = hasColumn("payments", "created_time") ? "p.created_time" : "p.payment_date";

        String sql = "SELECT p.id, p.person_id, per.full_name AS person_name, " +
                categoryExpr + " AS category, p.description, " +
                priceExpr + " AS price, " +
                paymentTypeExpr + " AS payment_type, " +
                importantExpr + " AS is_important, " +
                createdExpr + " AS created_time " +
                "FROM payments p " +
                "LEFT JOIN persons per ON per.id = p.person_id " +
                (hasColumn("payments", "category_id") ? "LEFT JOIN categories c ON c.id = p.category_id " : "") +
                q.where;

        List<Map<String, Object>> rows = jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("personId", rs.getObject("person_id") == null ? null : rs.getLong("person_id"));
            row.put("personName", rs.getString("person_name"));
            row.put("category", rs.getString("category"));
            row.put("description", rs.getString("description"));
            row.put("price", rs.getBigDecimal("price"));
            row.put("paymentType", rs.getString("payment_type"));
            row.put("isImportant", rs.getBoolean("is_important"));
            Object created = rs.getObject("created_time");
            row.put("createdTime", created == null ? null : created.toString());
            return row;
        }, q.params.toArray());

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "To'lov topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, PaymentCreateRequest request) {
        if (request.getPersonId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "personId majburiy"));
        }

        Boolean personExists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM persons WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                request.getPersonId(),
                orgId
        );
        if (!Boolean.TRUE.equals(personExists)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mijoz topilmadi"));
        }

        List<String> cols = new ArrayList<>(List.of("organization_id", "person_id"));
        List<Object> vals = new ArrayList<>(List.of(orgId, request.getPersonId()));

        if (hasColumn("payments", "category")) {
            cols.add("category");
            vals.add(request.getCategory());
        }
        if (hasColumn("payments", "description")) {
            cols.add("description");
            vals.add(request.getDescription());
        }
        if (hasColumn("payments", "price")) {
            cols.add("price");
            vals.add(nvl(request.getPrice()));
        }
        if (hasColumn("payments", "amount")) {
            cols.add("amount");
            vals.add(nvl(request.getPrice()));
        }
        if (hasColumn("payments", "payment_type")) {
            cols.add("payment_type");
            vals.add(request.getPaymentType() == null ? "income" : request.getPaymentType());
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
        Long id = jdbc.queryForObject(
                "INSERT INTO payments(" + String.join(",", cols) + ") VALUES(" + placeholders + ") RETURNING id",
                Long.class,
                vals.toArray()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", id,
                "message", "To'lov muvaffaqiyatli yaratildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        Integer updated = jdbc.update("DELETE FROM payments WHERE id=? AND organization_id=?", id, orgId);
        if (updated == null || updated == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "To'lov topilmadi"));
        }
        return ResponseEntity.ok(Map.of("message", "To'lov muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> settlePaymentsByPerson(Integer orgId, Long personId) {
        if (!hasColumn("payments", "is_important")) {
            return ResponseEntity.ok(Map.of("message", "Barcha to'lovlar yopildi"));
        }

        jdbc.update(
                "UPDATE payments SET is_important=false WHERE organization_id=? AND person_id=?",
                orgId,
                personId
        );
        return ResponseEntity.ok(Map.of("message", "Barcha to'lovlar yopildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> settlePayment(Integer orgId, Long id) {
        if (!hasColumn("payments", "is_important")) {
            return ResponseEntity.ok(Map.of("message", "To'lov yopildi"));
        }

        Integer updated = jdbc.update(
                "UPDATE payments SET is_important=false WHERE organization_id=? AND id=?",
                orgId,
                id
        );
        if (updated == null || updated == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "To'lov topilmadi"));
        }
        return ResponseEntity.ok(Map.of("message", "To'lov yopildi"));
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId,
                                       Long personId,
                                       String category,
                                       String paymentType,
                                       Boolean isImportant) {

        QueryData q = buildWhere(orgId, personId, category, paymentType, isImportant);

        String categoryExpr = hasColumn("payments", "category")
                ? "p.category"
                : (hasColumn("payments", "category_id") ? "COALESCE(c.name_uz, c.nameUz, '')" : "''");
        String priceExpr = "COALESCE(" + (hasColumn("payments", "price") ? "p.price" : "NULL") + ", " +
                (hasColumn("payments", "amount") ? "p.amount" : "0") + ")";
        String paymentTypeExpr = hasColumn("payments", "payment_type") ? "p.payment_type" : "'income'";
        String importantExpr = hasColumn("payments", "is_important") ? "p.is_important" : "true";
        String createdExpr = hasColumn("payments", "created_time") ? "p.created_time" : "p.payment_date";

        String sql = "SELECT p.id, p.person_id, per.full_name AS person_name, " +
                categoryExpr + " AS category, p.description, " +
                priceExpr + " AS price, " +
                paymentTypeExpr + " AS payment_type, " +
                importantExpr + " AS is_important, " +
                createdExpr + " AS created_time " +
                "FROM payments p " +
                "LEFT JOIN persons per ON per.id = p.person_id " +
                (hasColumn("payments", "category_id") ? "LEFT JOIN categories c ON c.id = p.category_id " : "") +
                q.where +
                " ORDER BY " + createdExpr + " DESC";

        List<Map<String, Object>> rows = jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("personName", rs.getString("person_name"));
            row.put("category", rs.getString("category"));
            row.put("description", rs.getString("description"));
            row.put("price", rs.getBigDecimal("price"));
            row.put("paymentType", rs.getString("payment_type"));
            row.put("isImportant", rs.getBoolean("is_important"));
            Object created = rs.getObject("created_time");
            row.put("createdTime", created == null ? null : created.toString());
            return row;
        }, q.params.toArray());

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payments");
            String[] cols = {"ID", "Person", "Category", "Description", "Price", "Payment Type", "Important", "Created Time"};
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
                r.createCell(1).setCellValue(String.valueOf(row.get("personName") == null ? "" : row.get("personName")));
                r.createCell(2).setCellValue(String.valueOf(row.get("category") == null ? "" : row.get("category")));
                r.createCell(3).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
                r.createCell(4).setCellValue(String.valueOf(row.get("price") == null ? "0" : row.get("price")));
                r.createCell(5).setCellValue(String.valueOf(row.get("paymentType") == null ? "" : row.get("paymentType")));
                r.createCell(6).setCellValue(Boolean.TRUE.equals(row.get("isImportant")) ? "Ha" : "Yo'q");
                r.createCell(7).setCellValue(String.valueOf(row.get("createdTime") == null ? "" : row.get("createdTime")));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "payments_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            workbook.write(Files.newOutputStream(filePath));

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));
        } catch (Exception e) {
            log.error("Payments excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private QueryData buildWhere(Integer orgId,
                                 Long personId,
                                 String category,
                                 String paymentType,
                                 Boolean isImportant) {
        QueryData q = new QueryData();

        StringBuilder where = new StringBuilder(" WHERE p.organization_id=? ");
        q.params.add(orgId);

        if (personId != null) {
            where.append(" AND p.person_id=? ");
            q.params.add(personId);
        }
        if (category != null && !category.isBlank() && hasColumn("payments", "category")) {
            where.append(" AND p.category=? ");
            q.params.add(category.trim());
        }
        if (paymentType != null && !paymentType.isBlank() && hasColumn("payments", "payment_type")) {
            where.append(" AND p.payment_type=? ");
            q.params.add(paymentType.trim());
        }
        if (isImportant != null && hasColumn("payments", "is_important")) {
            where.append(" AND p.is_important=? ");
            q.params.add(isImportant);
        }

        q.where = where.toString();
        return q;
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private boolean hasColumn(String table, String column) {
        String key = table + "." + column;
        return columnExistsCache.computeIfAbsent(key, k -> {
            try {
                Boolean exists = jdbc.queryForObject(
                        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?)",
                        Boolean.class,
                        table,
                        column
                );
                return Boolean.TRUE.equals(exists);
            } catch (Exception e) {
                return false;
            }
        });
    }

    private static class QueryData {
        String where;
        List<Object> params = new ArrayList<>();
    }
}

