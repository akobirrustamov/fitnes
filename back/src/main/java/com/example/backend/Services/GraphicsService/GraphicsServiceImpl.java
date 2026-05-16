package com.example.backend.Services.GraphicsService;

import com.example.backend.Payload.req.GraphicsRequest;
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

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GraphicsServiceImpl implements GraphicsService {

    private static final String TABLE = "organization_graphics";
    private final JdbcTemplate jdbc;

    @Override
    public HttpEntity<?> getAll(Integer orgId) {
        ensureTables();

        List<Map<String, Object>> data = jdbc.query(
                "SELECT id, name, description, is_monday, is_tuesday, is_wednesday, is_thursday, is_friday, is_saturday, is_sunday, created_time " +
                        "FROM " + TABLE + " WHERE organization_id=? AND deleted=false ORDER BY created_time DESC",
                (rs, rowNum) -> toResponseRow(rs, true),
                orgId
        );
        return ResponseEntity.ok(data);
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        ensureTables();

        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, name, description, is_monday, is_tuesday, is_wednesday, is_thursday, is_friday, is_saturday, is_sunday " +
                        "FROM " + TABLE + " WHERE id=? AND organization_id=? AND deleted=false",
                (rs, rowNum) -> toResponseRow(rs, false),
                id, orgId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Grafik topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, GraphicsRequest request) {
        ensureTables();

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name majburiy"));
        }

        int maxCount = maxGraphicsCount();
        Integer currentCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM " + TABLE + " WHERE organization_id=? AND deleted=false",
                Integer.class,
                orgId
        );
        int safeCount = currentCount == null ? 0 : currentCount;
        if (safeCount >= maxCount) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "G001",
                    "message", "Grafiklar soni limitdan oshdi"
            ));
        }

        Long id = jdbc.queryForObject(
                "INSERT INTO " + TABLE + " (organization_id, name, description, is_monday, is_tuesday, is_wednesday, is_thursday, is_friday, is_saturday, is_sunday, created_time, deleted) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), false) RETURNING id",
                Long.class,
                orgId,
                request.getName(),
                request.getDescription(),
                bool(request.getIsMonday()),
                bool(request.getIsTuesday()),
                bool(request.getIsWednesday()),
                bool(request.getIsThursday()),
                bool(request.getIsFriday()),
                bool(request.getIsSaturday()),
                bool(request.getIsSunday())
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", id,
                "message", "Grafik muvaffaqiyatli yaratildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, GraphicsRequest request) {
        ensureTables();

        if (!exists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Grafik topilmadi"));
        }

        jdbc.update(
                "UPDATE " + TABLE + " SET " +
                        "name = COALESCE(?, name), " +
                        "description = COALESCE(?, description), " +
                        "is_monday = COALESCE(?, is_monday), " +
                        "is_tuesday = COALESCE(?, is_tuesday), " +
                        "is_wednesday = COALESCE(?, is_wednesday), " +
                        "is_thursday = COALESCE(?, is_thursday), " +
                        "is_friday = COALESCE(?, is_friday), " +
                        "is_saturday = COALESCE(?, is_saturday), " +
                        "is_sunday = COALESCE(?, is_sunday), " +
                        "updated_time = NOW() " +
                        "WHERE id=? AND organization_id=? AND deleted=false",
                request.getName(),
                request.getDescription(),
                request.getIsMonday(),
                request.getIsTuesday(),
                request.getIsWednesday(),
                request.getIsThursday(),
                request.getIsFriday(),
                request.getIsSaturday(),
                request.getIsSunday(),
                id,
                orgId
        );

        return ResponseEntity.ok(Map.of("message", "Grafik muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        ensureTables();

        if (!exists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Grafik topilmadi"));
        }

        Integer personsCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM persons WHERE organization_id=? AND deleted=false AND graphic_id=?",
                Integer.class,
                orgId,
                id.intValue()
        );

        if (personsCount != null && personsCount > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "G002",
                    "message", "Grafik ishlatilmoqda, o'chirib bo'lmaydi"
            ));
        }

        jdbc.update("UPDATE " + TABLE + " SET deleted=true, updated_time=NOW() WHERE id=? AND organization_id=?", id, orgId);
        return ResponseEntity.ok(Map.of("message", "Grafik muvaffaqiyatli o'chirildi"));
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId) {
        ensureTables();

        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, name, description, is_monday, is_tuesday, is_wednesday, is_thursday, is_friday, is_saturday, is_sunday, created_time " +
                        "FROM " + TABLE + " WHERE organization_id=? AND deleted=false ORDER BY created_time DESC",
                (rs, rowNum) -> toResponseRow(rs, true),
                orgId
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Graphics");
            String[] cols = {"ID", "Name", "Description", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Created"};
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
                r.createCell(1).setCellValue(String.valueOf(row.get("name")));
                r.createCell(2).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
                r.createCell(3).setCellValue(boolString(row.get("isMonday")));
                r.createCell(4).setCellValue(boolString(row.get("isTuesday")));
                r.createCell(5).setCellValue(boolString(row.get("isWednesday")));
                r.createCell(6).setCellValue(boolString(row.get("isThursday")));
                r.createCell(7).setCellValue(boolString(row.get("isFriday")));
                r.createCell(8).setCellValue(boolString(row.get("isSaturday")));
                r.createCell(9).setCellValue(boolString(row.get("isSunday")));
                r.createCell(10).setCellValue(String.valueOf(row.get("createdTime") == null ? "" : row.get("createdTime")));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "graphics_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            workbook.write(Files.newOutputStream(filePath));

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));

        } catch (Exception e) {
            log.error("Graphics excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private boolean exists(Integer orgId, Long id) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM " + TABLE + " WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                id,
                orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private void ensureTables() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS organization_graphics (" +
                "id BIGSERIAL PRIMARY KEY," +
                "organization_id INTEGER NOT NULL," +
                "name VARCHAR(255) NOT NULL," +
                "description VARCHAR(500)," +
                "is_monday BOOLEAN NOT NULL DEFAULT false," +
                "is_tuesday BOOLEAN NOT NULL DEFAULT false," +
                "is_wednesday BOOLEAN NOT NULL DEFAULT false," +
                "is_thursday BOOLEAN NOT NULL DEFAULT false," +
                "is_friday BOOLEAN NOT NULL DEFAULT false," +
                "is_saturday BOOLEAN NOT NULL DEFAULT false," +
                "is_sunday BOOLEAN NOT NULL DEFAULT false," +
                "created_time TIMESTAMP NOT NULL DEFAULT NOW()," +
                "updated_time TIMESTAMP," +
                "deleted BOOLEAN NOT NULL DEFAULT false" +
                ")");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_org_graphics_org ON organization_graphics(organization_id)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS api_settings (" +
                "id BIGSERIAL PRIMARY KEY," +
                "max_graphics_count INTEGER NOT NULL DEFAULT 50" +
                ")");
        jdbc.execute("INSERT INTO api_settings(max_graphics_count) " +
                "SELECT 50 WHERE NOT EXISTS (SELECT 1 FROM api_settings)");
    }

    private int maxGraphicsCount() {
        Integer max = jdbc.queryForObject(
                "SELECT max_graphics_count FROM api_settings ORDER BY id DESC LIMIT 1",
                Integer.class
        );
        return max == null ? 50 : Math.max(max, 1);
    }

    private boolean bool(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private String boolString(Object value) {
        return Boolean.TRUE.equals(value) ? "Ha" : "Yo'q";
    }

    private Map<String, Object> toResponseRow(java.sql.ResultSet rs, boolean withCreated) throws java.sql.SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rs.getLong("id"));
        m.put("name", rs.getString("name"));
        m.put("description", rs.getString("description"));
        m.put("isMonday", rs.getBoolean("is_monday"));
        m.put("isTuesday", rs.getBoolean("is_tuesday"));
        m.put("isWednesday", rs.getBoolean("is_wednesday"));
        m.put("isThursday", rs.getBoolean("is_thursday"));
        m.put("isFriday", rs.getBoolean("is_friday"));
        m.put("isSaturday", rs.getBoolean("is_saturday"));
        m.put("isSunday", rs.getBoolean("is_sunday"));
        if (withCreated) {
            Object created = rs.getObject("created_time");
            m.put("createdTime", created == null ? null : created.toString());
        }
        return m;
    }
}

