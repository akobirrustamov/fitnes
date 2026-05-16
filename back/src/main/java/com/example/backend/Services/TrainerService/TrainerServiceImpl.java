package com.example.backend.Services.TrainerService;

import com.example.backend.Payload.req.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrainerServiceImpl implements TrainerService {

    private final JdbcTemplate jdbc;
    private final Map<String, Boolean> columnExistsCache = new ConcurrentHashMap<>();

    @Override
    public HttpEntity<?> getAll(Integer orgId) {
        ensureTrainerTable();

        String expectedSql = hasColumn("persons", "trainer_monthly_price")
                ? "COALESCE(SUM(p.trainer_monthly_price),0)"
                : "COALESCE(SUM(t.price),0)";

        String actualSql = hasColumn("payments", "payment_type")
                ? "COALESCE(SUM(CASE WHEN pay.payment_type='income' THEN COALESCE(pay.amount, pay.price, 0) ELSE 0 END),0)"
                : "COALESCE(SUM(COALESCE(pay.amount, pay.price, 0)),0)";

        String query = "SELECT t.id, t.fullname, t.photo_url, t.achievements, t.price, t.phone_number, t.specialization, " +
                "t.experience_years, t.active, t.created_time, " +
                "COUNT(p.id) AS students_count, " +
                expectedSql + " AS expected_income_this_month, " +
                actualSql + " AS actual_income_this_month " +
                "FROM trainers t " +
                "LEFT JOIN persons p ON p.trainer_id = t.id AND p.organization_id=t.organization_id AND p.deleted=false " +
                "LEFT JOIN payments pay ON pay.person_id = p.id AND pay.organization_id=t.organization_id " +
                "AND EXTRACT(YEAR FROM " + paymentDateColumn() + ")=EXTRACT(YEAR FROM CURRENT_DATE) " +
                "AND EXTRACT(MONTH FROM " + paymentDateColumn() + ")=EXTRACT(MONTH FROM CURRENT_DATE) " +
                "WHERE t.organization_id=? AND t.deleted=false " +
                "GROUP BY t.id ORDER BY t.created_time DESC";

        List<Map<String, Object>> data = jdbc.query(query, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("fullname", rs.getString("fullname"));
            row.put("photoUrl", rs.getString("photo_url"));
            row.put("achievements", rs.getString("achievements"));
            row.put("price", rs.getBigDecimal("price"));
            row.put("phoneNumber", rs.getString("phone_number"));
            row.put("specialization", rs.getString("specialization"));
            row.put("experienceYears", rs.getObject("experience_years") == null ? null : rs.getInt("experience_years"));
            row.put("active", rs.getBoolean("active"));
            row.put("studentsCount", rs.getLong("students_count"));
            row.put("expectedIncomeThisMonth", rs.getBigDecimal("expected_income_this_month"));
            row.put("actualIncomeThisMonth", rs.getBigDecimal("actual_income_this_month"));
            Object created = rs.getObject("created_time");
            row.put("createdTime", created == null ? null : created.toString());
            return row;
        }, orgId);

        return ResponseEntity.ok(data);
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        ensureTrainerTable();

        List<Map<String, Object>> trainerRows = jdbc.query(
                "SELECT t.id, t.fullname, t.photo_url, t.price, COUNT(p.id) AS students_count " +
                        "FROM trainers t " +
                        "LEFT JOIN persons p ON p.trainer_id=t.id AND p.organization_id=t.organization_id AND p.deleted=false " +
                        "WHERE t.id=? AND t.organization_id=? AND t.deleted=false " +
                        "GROUP BY t.id",
                (rs, rowNum) -> {
                    Map<String, Object> trainer = new LinkedHashMap<>();
                    trainer.put("id", rs.getLong("id"));
                    trainer.put("fullname", rs.getString("fullname"));
                    trainer.put("photoUrl", rs.getString("photo_url"));
                    trainer.put("price", rs.getBigDecimal("price"));
                    trainer.put("studentsCount", rs.getLong("students_count"));
                    return trainer;
                },
                id, orgId
        );

        if (trainerRows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        String studentsSql = "SELECT p.id, p.full_name, p.photo_url, " +
                (hasColumn("persons", "subscription_end") ? "p.subscription_end" : "NULL") + " AS subscription_end_date " +
                "FROM persons p WHERE p.organization_id=? AND p.deleted=false AND p.trainer_id=? " +
                "ORDER BY p.id DESC";

        List<Map<String, Object>> students = jdbc.query(studentsSql, (rs, rowNum) -> {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("id", rs.getLong("id"));
            s.put("fullname", rs.getString("full_name"));
            s.put("photoUrl", rs.getString("photo_url"));
            Object subEnd = rs.getObject("subscription_end_date");
            s.put("subscriptionEndDate", subEnd == null ? null : subEnd.toString());
            return s;
        }, orgId, id);

        return ResponseEntity.ok(Map.of(
                "trainer", trainerRows.get(0),
                "students", students
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, TrainerCreateRequest request) {
        ensureTrainerTable();

        if (request.getFullname() == null || request.getFullname().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "fullname majburiy"));
        }

        Long id = jdbc.queryForObject(
                "INSERT INTO trainers(organization_id, fullname, photo_url, achievements, price, phone_number, specialization, experience_years, bio, active, created_time, deleted) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), false) RETURNING id",
                Long.class,
                orgId,
                request.getFullname(),
                request.getPhotoUrl(),
                request.getAchievements(),
                nvl(request.getPrice()),
                request.getPhoneNumber(),
                request.getSpecialization(),
                request.getExperienceYears(),
                request.getBio(),
                request.getActive() == null || request.getActive()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", id,
                "message", "Murabbiy muvaffaqiyatli qo'shildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, TrainerUpdateRequest request) {
        ensureTrainerTable();

        if (!trainerExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        jdbc.update(
                "UPDATE trainers SET " +
                        "fullname = COALESCE(?, fullname), " +
                        "photo_url = COALESCE(?, photo_url), " +
                        "achievements = COALESCE(?, achievements), " +
                        "price = COALESCE(?, price), " +
                        "phone_number = COALESCE(?, phone_number), " +
                        "specialization = COALESCE(?, specialization), " +
                        "experience_years = COALESCE(?, experience_years), " +
                        "bio = COALESCE(?, bio), " +
                        "active = COALESCE(?, active), " +
                        "updated_time = NOW() " +
                        "WHERE id=? AND organization_id=? AND deleted=false",
                request.getFullname(),
                request.getPhotoUrl(),
                request.getAchievements(),
                request.getPrice(),
                request.getPhoneNumber(),
                request.getSpecialization(),
                request.getExperienceYears(),
                request.getBio(),
                request.getActive(),
                id,
                orgId
        );

        return ResponseEntity.ok(Map.of("message", "Murabbiy muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        ensureTrainerTable();

        if (!trainerExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        jdbc.update("UPDATE persons SET trainer_id=NULL WHERE organization_id=? AND trainer_id=? AND deleted=false", orgId, id);
        jdbc.update("UPDATE trainers SET deleted=true, active=false, updated_time=NOW() WHERE id=? AND organization_id=?", id, orgId);

        return ResponseEntity.ok(Map.of("message", "Murabbiy muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> addStudent(Integer orgId, Long trainerId, TrainerAddStudentRequest request) {
        ensureTrainerTable();

        if (!trainerExists(orgId, trainerId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }
        if (request.getPersonId() == null || !personExists(orgId, request.getPersonId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shogird topilmadi"));
        }

        jdbc.update("UPDATE persons SET trainer_id=? WHERE id=? AND organization_id=? AND deleted=false",
                trainerId, request.getPersonId(), orgId);

        return ResponseEntity.ok(Map.of("message", "Shogird muvaffaqiyatli qo'shildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> removeStudent(Integer orgId, Long trainerId, Long personId) {
        ensureTrainerTable();

        if (!trainerExists(orgId, trainerId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }
        if (!personExists(orgId, personId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shogird topilmadi"));
        }

        jdbc.update("UPDATE persons SET trainer_id=NULL WHERE id=? AND organization_id=? AND trainer_id=? AND deleted=false",
                personId, orgId, trainerId);

        return ResponseEntity.ok(Map.of("message", "Shogird muvaffaqiyatli uzildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> extendStudentSubscription(Integer orgId,
                                                   Long trainerId,
                                                   TrainerExtendStudentSubscriptionRequest request) {
        ensureTrainerTable();

        if (!trainerExists(orgId, trainerId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }
        if (request.getPersonId() == null || !personExists(orgId, request.getPersonId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shogird topilmadi"));
        }

        BigDecimal price = nvl(request.getPrice());
        BigDecimal paid = nvl(request.getPaidAmount());

        LocalDate oldEnd = hasColumn("persons", "subscription_end")
                ? jdbc.queryForObject("SELECT subscription_end FROM persons WHERE id=? AND organization_id=?",
                LocalDate.class, request.getPersonId(), orgId)
                : null;
        LocalDate start = oldEnd != null && oldEnd.isAfter(LocalDate.now()) ? oldEnd : LocalDate.now();
        LocalDate newEndDate = start.plusMonths(1);

        BigDecimal oldDebt = hasColumn("persons", "debt")
                ? jdbc.queryForObject("SELECT COALESCE(debt,0) FROM persons WHERE id=? AND organization_id=?",
                BigDecimal.class, request.getPersonId(), orgId)
                : BigDecimal.ZERO;
        if (oldDebt == null) oldDebt = BigDecimal.ZERO;

        BigDecimal newDebt = oldDebt.add(price.subtract(paid).max(BigDecimal.ZERO));

        if (hasColumn("persons", "subscription_end") && hasColumn("persons", "debt")) {
            jdbc.update("UPDATE persons SET subscription_end=?, debt=? WHERE id=? AND organization_id=?",
                    newEndDate, newDebt, request.getPersonId(), orgId);
        } else if (hasColumn("persons", "subscription_end")) {
            jdbc.update("UPDATE persons SET subscription_end=? WHERE id=? AND organization_id=?",
                    newEndDate, request.getPersonId(), orgId);
        }

        insertTrainerPayment(orgId, request.getPersonId(), trainerId, "expense", price, "Murabbiy obuna narxi");
        insertTrainerPayment(orgId, request.getPersonId(), trainerId, "income", paid, "Murabbiy obuna to'lovi");

        return ResponseEntity.ok(Map.of(
                "message", "Obuna muvaffaqiyatli uzaytirildi",
                "newEndDate", newEndDate,
                "debt", newDebt
        ));
    }

    private void ensureTrainerTable() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS trainers (" +
                "id BIGSERIAL PRIMARY KEY," +
                "organization_id INTEGER NOT NULL," +
                "fullname VARCHAR(255) NOT NULL," +
                "photo_url VARCHAR(500)," +
                "achievements VARCHAR(1000)," +
                "price DECIMAL(18,2) NOT NULL DEFAULT 0," +
                "phone_number VARCHAR(50)," +
                "specialization VARCHAR(255)," +
                "experience_years INTEGER," +
                "bio TEXT," +
                "active BOOLEAN NOT NULL DEFAULT true," +
                "created_time TIMESTAMP NOT NULL DEFAULT NOW()," +
                "updated_time TIMESTAMP," +
                "deleted BOOLEAN NOT NULL DEFAULT false" +
                ")");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_trainers_org ON trainers(organization_id)");
    }

    private String paymentDateColumn() {
        return hasColumn("payments", "created_time") ? "pay.created_time" : "pay.payment_date";
    }

    private boolean trainerExists(Integer orgId, Long id) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM trainers WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                id,
                orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private boolean personExists(Integer orgId, Long personId) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM persons WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                personId,
                orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private void insertTrainerPayment(Integer orgId,
                                      Long personId,
                                      Long trainerId,
                                      String paymentType,
                                      BigDecimal amount,
                                      String description) {

        List<String> cols = new ArrayList<>(List.of("organization_id", "person_id"));
        List<Object> vals = new ArrayList<>(List.of(orgId, personId));

        if (hasColumn("payments", "category")) {
            cols.add("category");
            vals.add("trainer");
        }
        if (hasColumn("payments", "payment_type")) {
            cols.add("payment_type");
            vals.add(paymentType);
        }
        if (hasColumn("payments", "amount")) {
            cols.add("amount");
            vals.add(amount);
        }
        if (hasColumn("payments", "price")) {
            cols.add("price");
            vals.add(amount);
        }
        if (hasColumn("payments", "description")) {
            cols.add("description");
            vals.add(description + " (trainerId=" + trainerId + ")");
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
}

