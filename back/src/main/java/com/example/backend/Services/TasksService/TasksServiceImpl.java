package com.example.backend.Services.TasksService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TasksServiceImpl implements TasksService {

    private final JdbcTemplate jdbc;

    @Override
    public HttpEntity<?> getAll(Integer orgId, Long terminalId, String waiting, String taskType, int page, int pageSize) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.min(500, Math.max(1, pageSize));

        StringBuilder where = new StringBuilder(" WHERE t.organization_id=? AND t.deleted=false ");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (terminalId != null) {
            where.append(" AND tt.terminal_id=? ");
            params.add(terminalId);
        }

        String dbStatus = mapWaitingToDb(waiting);
        if (dbStatus != null) {
            where.append(" AND LOWER(tt.status)=? ");
            params.add(dbStatus.toLowerCase());
        }

        String dbTaskType = mapTaskTypeToDb(taskType);
        if (dbTaskType != null) {
            where.append(" AND LOWER(tt.action)=? ");
            params.add(dbTaskType.toLowerCase());
        }

        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM terminal_tasks tt JOIN terminals t ON t.id=tt.terminal_id " + where,
                Long.class,
                params.toArray()
        );

        List<Object> listParams = new ArrayList<>(params);
        listParams.add(safePageSize);
        listParams.add((safePage - 1L) * safePageSize);

        List<Map<String, Object>> data = jdbc.query(
                "SELECT tt.id, tt.terminal_id, t.name AS terminal_name, tt.person_id, p.full_name AS person_name, tt.action, tt.status, tt.created_at " +
                        "FROM terminal_tasks tt JOIN terminals t ON t.id=tt.terminal_id LEFT JOIN persons p ON p.id=tt.person_id " +
                        where + " ORDER BY tt.created_at DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("terminalId", rs.getLong("terminal_id"));
                    row.put("terminalName", rs.getString("terminal_name"));
                    row.put("personId", rs.getObject("person_id") == null ? null : rs.getLong("person_id"));
                    row.put("personName", rs.getString("person_name"));
                    row.put("taskType", mapDbTaskTypeToApi(rs.getString("action")));
                    row.put("waiting", mapDbStatusToApi(rs.getString("status")));
                    Object created = rs.getObject("created_at");
                    row.put("createdTime", created == null ? null : created.toString());
                    return row;
                },
                listParams.toArray()
        );

        long safeTotal = total == null ? 0L : total;
        return ResponseEntity.ok(Map.of("data", data, "totalCount", safeTotal, "page", safePage, "pageSize", safePageSize));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT tt.id, tt.terminal_id, t.name AS terminal_name, tt.person_id, p.full_name AS person_name, tt.action, tt.status, tt.created_at " +
                        "FROM terminal_tasks tt JOIN terminals t ON t.id=tt.terminal_id LEFT JOIN persons p ON p.id=tt.person_id " +
                        "WHERE tt.id=? AND t.organization_id=? AND t.deleted=false",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("terminalId", rs.getLong("terminal_id"));
                    row.put("terminalName", rs.getString("terminal_name"));
                    row.put("personId", rs.getObject("person_id") == null ? null : rs.getLong("person_id"));
                    row.put("personName", rs.getString("person_name"));
                    row.put("taskType", mapDbTaskTypeToApi(rs.getString("action")));
                    row.put("waiting", mapDbStatusToApi(rs.getString("status")));
                    Object created = rs.getObject("created_at");
                    row.put("createdTime", created == null ? null : created.toString());
                    return row;
                },
                id,
                orgId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Task topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    public HttpEntity<?> getByPerson(Integer orgId, Long personId) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT tt.id, t.name AS terminal_name, tt.action, tt.status FROM terminal_tasks tt " +
                        "JOIN terminals t ON t.id=tt.terminal_id " +
                        "WHERE tt.person_id=? AND t.organization_id=? AND t.deleted=false ORDER BY tt.created_at DESC",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("terminalName", rs.getString("terminal_name"));
                    row.put("taskType", mapDbTaskTypeToApi(rs.getString("action")));
                    row.put("waiting", mapDbStatusToApi(rs.getString("status")));
                    return row;
                },
                personId,
                orgId
        );

        return ResponseEntity.ok(rows);
    }

    private String mapWaitingToDb(String waiting) {
        if (waiting == null || waiting.isBlank()) return null;
        String val = waiting.trim().toLowerCase();
        return switch (val) {
            case "pending" -> "PENDING";
            case "success" -> "DONE";
            case "error" -> "FAILED";
            default -> null;
        };
    }

    private String mapDbStatusToApi(String status) {
        if (status == null) return null;
        return switch (status.toUpperCase()) {
            case "PENDING" -> "pending";
            case "DONE" -> "success";
            case "FAILED" -> "error";
            default -> status.toLowerCase();
        };
    }

    private String mapTaskTypeToDb(String taskType) {
        if (taskType == null || taskType.isBlank()) return null;
        String val = taskType.trim().toLowerCase();
        return switch (val) {
            case "add" -> "add";
            case "update" -> "update";
            case "delete" -> "delete";
            case "photo-update" -> "photo";
            case "clear-data" -> "add_all_persons";
            default -> null;
        };
    }

    private String mapDbTaskTypeToApi(String action) {
        if (action == null) return null;
        return switch (action.toLowerCase()) {
            case "photo" -> "photo-update";
            case "add_all_persons" -> "clear-data";
            default -> action.toLowerCase();
        };
    }
}

