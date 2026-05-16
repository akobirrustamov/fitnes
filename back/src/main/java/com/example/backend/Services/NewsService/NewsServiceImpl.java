package com.example.backend.Services.NewsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsServiceImpl implements NewsService {

    private final JdbcTemplate jdbc;

    @Override
    public HttpEntity<?> getAll(Integer orgId, int page, int pageSize, Boolean isRead) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.min(500, Math.max(1, pageSize));

        StringBuilder where = new StringBuilder(
                " WHERE no2.organization_id=? AND n.active=true AND (n.end_time IS NULL OR n.end_time > NOW()) "
        );
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (isRead != null) {
            where.append(" AND no2.is_read=? ");
            params.add(isRead);
        }

        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM news_organizations no2 JOIN news n ON n.id=no2.news_id " + where,
                Long.class,
                params.toArray()
        );

        List<Object> listParams = new ArrayList<>(params);
        listParams.add(safePageSize);
        listParams.add((safePage - 1L) * safePageSize);

        List<Map<String, Object>> items = jdbc.query(
                "SELECT n.id AS news_id, n.title, n.description, n.content, n.photo_url, n.url, n.start_time, n.end_time, " +
                        "no2.is_read, n.created_at " +
                        "FROM news_organizations no2 " +
                        "JOIN news n ON n.id=no2.news_id " +
                        where +
                        " ORDER BY n.created_at DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("newsId", rs.getLong("news_id"));
                    row.put("title", rs.getString("title"));
                    row.put("description", rs.getString("description"));
                    row.put("content", rs.getString("content"));
                    row.put("photoUrl", rs.getString("photo_url"));
                    row.put("url", rs.getString("url"));
                    Object start = rs.getObject("start_time");
                    Object end = rs.getObject("end_time");
                    row.put("startTime", start == null ? null : start.toString());
                    row.put("endTime", end == null ? null : end.toString());
                    row.put("isRead", rs.getBoolean("is_read"));
                    Object created = rs.getObject("created_at");
                    row.put("createdTime", created == null ? null : created.toString());
                    return row;
                },
                listParams.toArray()
        );

        long safeTotal = total == null ? 0L : total;
        return ResponseEntity.ok(Map.of(
                "items", items,
                "totalCount", safeTotal,
                "page", safePage,
                "pageSize", safePageSize
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long newsId) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT n.id AS news_id, n.title, n.description, n.content, n.photo_url, n.url, no2.is_read " +
                        "FROM news_organizations no2 " +
                        "JOIN news n ON n.id=no2.news_id " +
                        "WHERE no2.organization_id=? AND n.id=? LIMIT 1",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("newsId", rs.getLong("news_id"));
                    row.put("title", rs.getString("title"));
                    row.put("description", rs.getString("description"));
                    row.put("content", rs.getString("content"));
                    row.put("photoUrl", rs.getString("photo_url"));
                    row.put("url", rs.getString("url"));
                    row.put("isRead", rs.getBoolean("is_read"));
                    return row;
                },
                orgId,
                newsId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Yangilik topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    @Transactional
    public HttpEntity<?> markAsRead(Integer orgId, Long newsId) {
        Integer result = null;
        try {
            result = jdbc.queryForObject(
                    "SELECT mark_news_as_read(?, ?)",
                    Integer.class,
                    orgId,
                    newsId
            );
        } catch (Exception e) {
            // fallback below
        }

        int updated;
        if (result != null) {
            updated = result;
        } else {
            updated = jdbc.update(
                    "UPDATE news_organizations SET is_read=true WHERE organization_id=? AND news_id=?",
                    orgId,
                    newsId
            );
        }

        if (updated < 1) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Yangilik topilmadi"));
        }

        return ResponseEntity.ok(Map.of("message", "Yangilik o'qilgan deb belgilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> markAllAsRead(Integer orgId) {
        try {
            jdbc.queryForObject("SELECT mark_all_news_as_read(?)", Integer.class, orgId);
        } catch (Exception e) {
            jdbc.update("UPDATE news_organizations SET is_read=true WHERE organization_id=?", orgId);
        }
        return ResponseEntity.ok(Map.of("message", "Barcha yangiliklar o'qilgan deb belgilandi"));
    }

    @Override
    public HttpEntity<?> getUnreadCount(Integer orgId) {
        Integer count = null;
        try {
            count = jdbc.queryForObject("SELECT get_unread_news_count(?)", Integer.class, orgId);
        } catch (Exception e) {
            count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM news_organizations no2 " +
                            "JOIN news n ON n.id=no2.news_id " +
                            "WHERE no2.organization_id=? AND no2.is_read=false AND n.active=true AND (n.end_time IS NULL OR n.end_time > NOW())",
                    Integer.class,
                    orgId
            );
        }
        int unread = count == null ? 0 : count;
        return ResponseEntity.ok(Map.of("unreadCount", unread));
    }
}

