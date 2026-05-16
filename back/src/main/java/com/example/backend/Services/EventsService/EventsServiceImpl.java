package com.example.backend.Services.EventsService;

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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventsServiceImpl implements EventsService {

    private final JdbcTemplate jdbc;

    @Override
    public HttpEntity<?> getAll(Integer orgId,
                                Long personId,
                                Long terminalId,
                                String eventType,
                                String startDate,
                                String endDate,
                                int page,
                                int limit) {

        int safePage = Math.max(1, page);
        int safeLimit = Math.min(500, Math.max(1, limit));

        QueryData q = buildBaseQuery(orgId, personId, terminalId, eventType, startDate, endDate, false);

        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM entries e " + q.where, Long.class, q.params.toArray());

        List<Object> listParams = new ArrayList<>(q.params);
        listParams.add(safeLimit);
        listParams.add((safePage - 1L) * safeLimit);

        String sql = q.select + q.where + " ORDER BY e.entry_time DESC LIMIT ? OFFSET ?";
        List<Map<String, Object>> data = jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("personId", rs.getObject("person_id") == null ? null : rs.getLong("person_id"));
            row.put("personName", rs.getString("person_name"));
            row.put("personPhoto", rs.getString("person_photo"));
            row.put("terminalId", rs.getObject("terminal_id") == null ? null : rs.getLong("terminal_id"));
            row.put("terminalName", rs.getString("terminal_name"));
            row.put("type", rs.getString("type"));
            Object dt = rs.getObject("datetime");
            row.put("datetime", dt == null ? null : dt.toString());
            row.put("description", rs.getString("description"));
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
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT e.id, e.person_id, p.full_name AS person_name, e.terminal_id, t.name AS terminal_name, " +
                        "CASE WHEN UPPER(e.direction)='IN' THEN 'enter' ELSE 'exit' END AS type, " +
                        "e.entry_time AS datetime, " +
                        "CASE WHEN UPPER(e.direction)='IN' THEN 'Kirish' ELSE 'Chiqish' END AS description " +
                        "FROM entries e " +
                        "LEFT JOIN persons p ON p.id=e.person_id " +
                        "LEFT JOIN terminals t ON t.id=e.terminal_id " +
                        "WHERE e.id=? AND e.organization_id=?",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("personId", rs.getObject("person_id") == null ? null : rs.getLong("person_id"));
                    row.put("personName", rs.getString("person_name"));
                    row.put("terminalId", rs.getObject("terminal_id") == null ? null : rs.getLong("terminal_id"));
                    row.put("terminalName", rs.getString("terminal_name"));
                    row.put("type", rs.getString("type"));
                    Object dt = rs.getObject("datetime");
                    row.put("datetime", dt == null ? null : dt.toString());
                    row.put("description", rs.getString("description"));
                    return row;
                },
                id,
                orgId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Hodisa topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    public HttpEntity<?> getLastByPerson(Integer orgId, Long personId) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT e.id, CASE WHEN UPPER(e.direction)='IN' THEN 'enter' ELSE 'exit' END AS type, " +
                        "e.entry_time AS datetime, t.name AS terminal_name " +
                        "FROM entries e " +
                        "LEFT JOIN terminals t ON t.id=e.terminal_id " +
                        "WHERE e.organization_id=? AND e.person_id=? " +
                        "ORDER BY e.entry_time DESC LIMIT 1",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("type", rs.getString("type"));
                    Object dt = rs.getObject("datetime");
                    row.put("datetime", dt == null ? null : dt.toString());
                    row.put("terminalName", rs.getString("terminal_name"));
                    return row;
                },
                orgId,
                personId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Hodisa topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    public HttpEntity<?> getToday(Integer orgId,
                                  Long terminalId,
                                  String eventType,
                                  int page,
                                  int limit) {
        String start = LocalDate.now().atStartOfDay().toString();
        String end = LocalDate.now().plusDays(1).atStartOfDay().toString();
        return getAll(orgId, null, terminalId, eventType, start, end, page, limit);
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId,
                                       Long personId,
                                       Long terminalId,
                                       String eventType,
                                       String startDate,
                                       String endDate) {

        QueryData q = buildBaseQuery(orgId, personId, terminalId, eventType, startDate, endDate, true);
        String sql = q.select + q.where + " ORDER BY e.entry_time DESC";

        List<Map<String, Object>> rows = jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("personName", rs.getString("person_name"));
            row.put("terminalName", rs.getString("terminal_name"));
            row.put("type", rs.getString("type"));
            Object dt = rs.getObject("datetime");
            row.put("datetime", dt == null ? null : dt.toString());
            row.put("description", rs.getString("description"));
            return row;
        }, q.params.toArray());

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Events");
            String[] cols = {"ID", "Person", "Terminal", "Type", "Datetime", "Description"};
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
                r.createCell(2).setCellValue(String.valueOf(row.get("terminalName") == null ? "" : row.get("terminalName")));
                r.createCell(3).setCellValue(String.valueOf(row.get("type") == null ? "" : row.get("type")));
                r.createCell(4).setCellValue(String.valueOf(row.get("datetime") == null ? "" : row.get("datetime")));
                r.createCell(5).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "events_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            workbook.write(Files.newOutputStream(filePath));

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));
        } catch (Exception e) {
            log.error("Events excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private QueryData buildBaseQuery(Integer orgId,
                                     Long personId,
                                     Long terminalId,
                                     String eventType,
                                     String startDate,
                                     String endDate,
                                     boolean downloadMode) {

        QueryData q = new QueryData();
        q.select = "SELECT e.id, e.person_id, p.full_name AS person_name, p.photo_url AS person_photo, " +
                "e.terminal_id, t.name AS terminal_name, " +
                "CASE WHEN UPPER(e.direction)='IN' THEN 'enter' ELSE 'exit' END AS type, " +
                "e.entry_time AS datetime, " +
                "CASE WHEN UPPER(e.direction)='IN' THEN 'Kirish' ELSE 'Chiqish' END AS description " +
                "FROM entries e " +
                "LEFT JOIN persons p ON p.id=e.person_id " +
                "LEFT JOIN terminals t ON t.id=e.terminal_id ";

        StringBuilder where = new StringBuilder(" WHERE e.organization_id=? ");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (personId != null) {
            where.append(" AND e.person_id=? ");
            params.add(personId);
        }
        if (terminalId != null) {
            where.append(" AND e.terminal_id=? ");
            params.add(terminalId);
        }
        if (eventType != null && !eventType.isBlank()) {
            String norm = eventType.trim().toLowerCase();
            if ("enter".equals(norm) || "in".equals(norm)) {
                where.append(" AND UPPER(e.direction)='IN' ");
            } else if ("exit".equals(norm) || "out".equals(norm)) {
                where.append(" AND UPPER(e.direction)='OUT' ");
            }
        }

        LocalDateTime from = parseDateTime(startDate);
        LocalDateTime to = parseDateTime(endDate);
        if (from != null) {
            where.append(" AND e.entry_time >= ? ");
            params.add(from);
        }
        if (to != null) {
            where.append(" AND e.entry_time <= ? ");
            params.add(to);
        }

        q.where = where.toString();
        q.params = params;
        return q;
    }

    private LocalDateTime parseDateTime(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            String t = val.trim();
            if (t.length() == 10) return LocalDate.parse(t).atStartOfDay();
            return LocalDateTime.parse(t.replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }

    private static class QueryData {
        String select;
        String where;
        List<Object> params;
    }
}

