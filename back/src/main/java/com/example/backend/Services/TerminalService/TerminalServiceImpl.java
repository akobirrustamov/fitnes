package com.example.backend.Services.TerminalService;

import com.example.backend.Payload.req.TerminalAddRequest;
import com.example.backend.Payload.req.TerminalUpdateRequest;
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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class TerminalServiceImpl implements TerminalService {

    private final JdbcTemplate jdbc;
    private final Map<String, Boolean> columnExistsCache = new ConcurrentHashMap<>();

    @Override
    public HttpEntity<?> getAll(Integer orgId, String part, int page, int pageSize) {
        ensureSettings();

        int safePage = Math.max(1, page);
        int safePageSize = Math.min(500, Math.max(1, pageSize));

        if (part != null && !part.isBlank() && part.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("message", "part kamida 3 ta belgidan iborat bo'lishi kerak"));
        }

        StringBuilder where = new StringBuilder(" WHERE t.organization_id=? AND t.deleted=false ");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (part != null && !part.isBlank()) {
            where.append(" AND (");
            where.append("t.name ILIKE ? OR t.description ILIKE ? OR t.ip ILIKE ? OR t.login ILIKE ? OR t.model ILIKE ?");
            where.append(") ");
            String q = "%" + part.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM terminals t " + where,
                Long.class,
                params.toArray()
        );

        List<Object> listParams = new ArrayList<>(params);
        listParams.add(safePageSize);
        listParams.add((safePage - 1L) * safePageSize);

        String lastOnlineExpr = hasColumn("terminals", "last_online") ? "t.last_online" : "NULL";
        String onlineExpr = hasColumn("terminals", "is_online")
                ? "t.is_online"
                : (hasColumn("terminals", "last_online")
                ? "(t.last_online >= NOW() - INTERVAL '5 minutes')"
                : "false");

        List<Map<String, Object>> data = jdbc.query(
                "SELECT t.id, t.organization_id, t.name, t.description, t.filter, t.created_at, " +
                        lastOnlineExpr + " AS last_online, t.ip, t.login, t.model, t.deleted, t.is_coming, " +
                        onlineExpr + " AS is_online " +
                        "FROM terminals t " + where +
                        " ORDER BY t.created_at DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("organizationId", rs.getInt("organization_id"));
                    row.put("name", rs.getString("name"));
                    row.put("description", rs.getString("description"));
                    row.put("filter", rs.getString("filter"));
                    Object created = rs.getObject("created_at");
                    row.put("createdTime", created == null ? null : created.toString());
                    Object last = rs.getObject("last_online");
                    row.put("lastOnline", last == null ? null : last.toString());
                    row.put("ip", rs.getString("ip"));
                    row.put("login", rs.getString("login"));
                    row.put("model", rs.getString("model"));
                    row.put("deleted", rs.getBoolean("deleted"));
                    row.put("isComing", rs.getBoolean("is_coming"));
                    row.put("isOnline", rs.getBoolean("is_online"));
                    return row;
                },
                listParams.toArray()
        );

        long safeTotal = total == null ? 0L : total;
        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", safeTotal,
                "page", safePage,
                "pageSize", safePageSize
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        ensureSettings();

        String lastOnlineExpr = hasColumn("terminals", "last_online") ? "t.last_online" : "NULL";
        String onlineExpr = hasColumn("terminals", "is_online")
                ? "t.is_online"
                : (hasColumn("terminals", "last_online")
                ? "(t.last_online >= NOW() - INTERVAL '5 minutes')"
                : "false");

        List<Map<String, Object>> rows = jdbc.query(
                "SELECT t.id, t.organization_id, t.name, t.description, t.filter, t.ip, t.login, t.password, t.model, " +
                        "t.is_coming, " + onlineExpr + " AS is_online, " + lastOnlineExpr + " AS last_online " +
                        "FROM terminals t WHERE t.id=? AND t.organization_id=? AND t.deleted=false",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("organizationId", rs.getInt("organization_id"));
                    row.put("name", rs.getString("name"));
                    row.put("description", rs.getString("description"));
                    row.put("filter", rs.getString("filter"));
                    row.put("ip", rs.getString("ip"));
                    row.put("login", rs.getString("login"));
                    row.put("password", rs.getString("password"));
                    row.put("model", rs.getString("model"));
                    row.put("isComing", rs.getBoolean("is_coming"));
                    row.put("isOnline", rs.getBoolean("is_online"));
                    Object last = rs.getObject("last_online");
                    row.put("lastOnline", last == null ? null : last.toString());
                    return row;
                },
                id,
                orgId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    public HttpEntity<?> download(Integer orgId, String part) {
        ensureSettings();

        StringBuilder where = new StringBuilder(" WHERE t.organization_id=? AND t.deleted=false ");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (part != null && !part.isBlank()) {
            where.append(" AND (t.name ILIKE ? OR t.description ILIKE ? OR t.ip ILIKE ? OR t.login ILIKE ? OR t.model ILIKE ?) ");
            String q = "%" + part.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        String lastOnlineExpr = hasColumn("terminals", "last_online") ? "t.last_online" : "NULL";

        List<Map<String, Object>> rows = jdbc.query(
                "SELECT t.id, t.name, t.description, t.filter, t.created_at, " + lastOnlineExpr + " AS last_online, " +
                        "t.ip, t.login, t.model, t.is_coming " +
                        "FROM terminals t " + where +
                        " ORDER BY t.created_at DESC",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    row.put("description", rs.getString("description"));
                    row.put("filter", rs.getString("filter"));
                    Object created = rs.getObject("created_at");
                    row.put("createdTime", created == null ? null : created.toString());
                    Object last = rs.getObject("last_online");
                    row.put("lastOnline", last == null ? null : last.toString());
                    row.put("ip", rs.getString("ip"));
                    row.put("login", rs.getString("login"));
                    row.put("model", rs.getString("model"));
                    row.put("isComing", rs.getBoolean("is_coming"));
                    return row;
                },
                params.toArray()
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Terminals");
            String[] cols = {"ID", "Name", "Description", "Filter", "Created", "Last Online", "IP", "Login", "Model", "Is Coming"};
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
                r.createCell(1).setCellValue(String.valueOf(row.get("name") == null ? "" : row.get("name")));
                r.createCell(2).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
                r.createCell(3).setCellValue(String.valueOf(row.get("filter") == null ? "" : row.get("filter")));
                r.createCell(4).setCellValue(String.valueOf(row.get("createdTime") == null ? "" : row.get("createdTime")));
                r.createCell(5).setCellValue(String.valueOf(row.get("lastOnline") == null ? "" : row.get("lastOnline")));
                r.createCell(6).setCellValue(String.valueOf(row.get("ip") == null ? "" : row.get("ip")));
                r.createCell(7).setCellValue(String.valueOf(row.get("login") == null ? "" : row.get("login")));
                r.createCell(8).setCellValue(String.valueOf(row.get("model") == null ? "" : row.get("model")));
                r.createCell(9).setCellValue(Boolean.TRUE.equals(row.get("isComing")) ? "Ha" : "Yo'q");
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "terminals_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            workbook.write(Files.newOutputStream(filePath));

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));
        } catch (Exception e) {
            log.error("Terminal excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    @Override
    @Transactional
    public HttpEntity<?> add(Integer orgId, TerminalAddRequest request) {
        ensureSettings();

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name majburiy"));
        }
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "login majburiy"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "password majburiy"));
        }

        Integer currentCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM terminals WHERE organization_id=? AND deleted=false",
                Integer.class,
                orgId
        );
        int maxCount = maxTerminalsCount();
        if ((currentCount == null ? 0 : currentCount) >= maxCount) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "T001",
                    "message", "Terminallar soni limitdan oshdi"
            ));
        }

        Integer result = jdbc.queryForObject(
                "SELECT add_terminal(?, ?, ?, ?, ?, ?, ?, ?, ?)",
                Integer.class,
                orgId,
                request.getName(),
                request.getDescription(),
                request.getIp(),
                request.getLogin(),
                request.getPassword(),
                request.getModel(),
                request.getFilter(),
                request.getIsComing() != null && request.getIsComing()
        );

        int code = result == null ? -1 : result;
        if (code == -2) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "T002",
                    "message", "Bunday IP manzil allaqachon mavjud"
            ));
        }
        if (code < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Terminal yaratib bo'lmadi"));
        }

        try {
            jdbc.update("SELECT create_terminal_tasks(?, ?, ?)", orgId, code, "add_all_persons");
        } catch (Exception e) {
            log.warn("create_terminal_tasks xatosi: {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "terminalId", code,
                "message", "Terminal muvaffaqiyatli qo'shildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, TerminalUpdateRequest request) {
        ensureSettings();

        if (!terminalExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        try {
            jdbc.update(
                    "UPDATE terminals SET " +
                            "name = COALESCE(?, name), " +
                            "description = COALESCE(?, description), " +
                            "filter = COALESCE(?, filter), " +
                            "is_coming = COALESCE(?, is_coming), " +
                            "ip = COALESCE(?, ip), " +
                            "login = COALESCE(?, login), " +
                            "password = COALESCE(?, password), " +
                            "model = COALESCE(?, model) " +
                            "WHERE id=? AND organization_id=? AND deleted=false",
                    request.getName(),
                    request.getDescription(),
                    request.getFilter(),
                    request.getIsComing(),
                    request.getIp(),
                    request.getLogin(),
                    request.getPassword(),
                    request.getModel(),
                    id,
                    orgId
            );
        } catch (Exception e) {
            String msg = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
            if (msg.contains("idx_terminals_ip")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "errorCode", "T002",
                        "message", "Bunday IP manzil allaqachon mavjud"
                ));
            }
            throw e;
        }

        return ResponseEntity.ok(Map.of(
                "terminalId", id,
                "message", "Terminal muvaffaqiyatli yangilandi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        ensureSettings();

        Integer result = jdbc.queryForObject(
                "SELECT delete_terminal(?, ?)",
                Integer.class,
                id.intValue(),
                orgId
        );

        int code = result == null ? -1 : result;
        if (code < 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        return ResponseEntity.ok(Map.of(
                "terminalId", id,
                "message", "Terminal muvaffaqiyatli o'chirildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> reset(Integer orgId, Long id) {
        ensureSettings();

        Integer result = jdbc.queryForObject(
                "SELECT reset_terminal(?, ?)",
                Integer.class,
                id,
                orgId
        );

        int count = result == null ? -1 : result;
        if (count < 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        return ResponseEntity.ok(Map.of(
                "terminalId", id,
                "message", "Terminal muvaffaqiyatli reset qilindi. " + count + " ta mijoz qayta yuklandi."
        ));
    }

    private boolean terminalExists(Integer orgId, Long id) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM terminals WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                id,
                orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private int maxTerminalsCount() {
        Integer max = jdbc.queryForObject(
                "SELECT max_terminals_count FROM api_settings ORDER BY id DESC LIMIT 1",
                Integer.class
        );
        return max == null ? 10 : Math.max(1, max);
    }

    private void ensureSettings() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS api_settings (" +
                "id BIGSERIAL PRIMARY KEY," +
                "max_graphics_count INTEGER NOT NULL DEFAULT 50," +
                "max_terminals_count INTEGER NOT NULL DEFAULT 10" +
                ")");
        jdbc.execute("ALTER TABLE api_settings ADD COLUMN IF NOT EXISTS max_terminals_count INTEGER NOT NULL DEFAULT 10");
        jdbc.execute("INSERT INTO api_settings(max_graphics_count, max_terminals_count) " +
                "SELECT 50, 10 WHERE NOT EXISTS (SELECT 1 FROM api_settings)");
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

