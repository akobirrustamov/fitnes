package com.example.backend.Services.DashboardService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * DashboardServiceImpl – tashkilot dashboard statistikalarini taqdim etadi.
 * Barcha so'rovlar JdbcTemplate orqali native SQL bilan bajariladi.
 * Jadvallar mavjud bo'lmasa (init bosqichi), graceful 0/[] qaytariladi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final JdbcTemplate jdbc;

    // ═══════════════════════════════════════════════════════════
    //  9.1  GET /api/v1/organizations/dashboard/getStats
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getStats(Integer orgId) {

        Map<String, Object> stats = new LinkedHashMap<>();

        // ── Clients ─────────────────────────────────────────
        stats.put("totalClients",   safeCount(
                "SELECT COUNT(*) FROM persons WHERE organization_id=? AND deleted=false AND is_staff=false",
                orgId));

        stats.put("activeClients",  safeCount(
                "SELECT COUNT(*) FROM persons WHERE organization_id=? AND deleted=false AND is_staff=false " +
                "AND active=true AND (subscription_end IS NULL OR subscription_end >= CURRENT_DATE)",
                orgId));

        stats.put("expiredClients", safeCount(
                "SELECT COUNT(*) FROM persons WHERE organization_id=? AND deleted=false AND is_staff=false " +
                "AND subscription_end < CURRENT_DATE",
                orgId));

        // ── Staff ────────────────────────────────────────────
        stats.put("totalStaff", safeCount(
                "SELECT COUNT(*) FROM persons WHERE organization_id=? AND deleted=false " +
                "AND is_staff=true AND active=true",
                orgId));

        // ── Income ───────────────────────────────────────────
        stats.put("dailyIncome", safeSum(
                "SELECT COALESCE(SUM(amount),0) FROM payments " +
                "WHERE organization_id=? AND payment_date::DATE = CURRENT_DATE",
                orgId));

        stats.put("monthlyIncome", safeSum(
                "SELECT COALESCE(SUM(amount),0) FROM payments WHERE organization_id=? " +
                "AND EXTRACT(YEAR  FROM payment_date) = EXTRACT(YEAR  FROM CURRENT_DATE) " +
                "AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)",
                orgId));

        // ── Debt ─────────────────────────────────────────────
        stats.put("totalDebt", safeSum(
                "SELECT COALESCE(SUM(debt),0) FROM persons " +
                "WHERE organization_id=? AND deleted=false AND is_staff=false",
                orgId));

        // ── Entries ──────────────────────────────────────────
        stats.put("todayEntries", safeCount(
                "SELECT COUNT(*) FROM entries " +
                "WHERE organization_id=? AND entry_time::DATE = CURRENT_DATE",
                orgId));

        stats.put("monthlyEntries", safeCount(
                "SELECT COUNT(*) FROM entries WHERE organization_id=? " +
                "AND EXTRACT(YEAR  FROM entry_time) = EXTRACT(YEAR  FROM CURRENT_DATE) " +
                "AND EXTRACT(MONTH FROM entry_time) = EXTRACT(MONTH FROM CURRENT_DATE)",
                orgId));

        // ── Terminals ────────────────────────────────────────
        stats.put("activeTerminals", safeCount(
                "SELECT COUNT(*) FROM terminals WHERE organization_id=? AND active=true AND deleted=false",
                orgId));

        stats.put("totalTerminals", safeCount(
                "SELECT COUNT(*) FROM terminals WHERE organization_id=? AND deleted=false",
                orgId));

        // ── Pending tasks ────────────────────────────────────
        stats.put("pendingTasks", safeCount(
                "SELECT COUNT(*) FROM terminal_tasks tt " +
                "JOIN terminals t ON t.id = tt.terminal_id " +
                "WHERE t.organization_id=? AND tt.status='PENDING'",
                orgId));

        return ResponseEntity.ok(stats);
    }

    // ═══════════════════════════════════════════════════════════
    //  9.2  GET /api/v1/organizations/dashboard/getMonthlyIncomeChart
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getMonthlyIncomeChart(Integer orgId) {
        List<Map<String, Object>> data = new ArrayList<>();
        try {
            data = jdbc.query(
                "SELECT TO_CHAR(payment_date, 'YYYY-MM') AS month, " +
                "       COALESCE(SUM(amount), 0)         AS income " +
                "FROM payments " +
                "WHERE organization_id = ? " +
                "  AND payment_date >= CURRENT_DATE - INTERVAL '12 months' " +
                "GROUP BY TO_CHAR(payment_date, 'YYYY-MM') " +
                "ORDER BY month ASC",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("month",  rs.getString("month"));
                    row.put("income", rs.getBigDecimal("income"));
                    return row;
                }, orgId);
        } catch (Exception e) {
            log.debug("getMonthlyIncomeChart fallback: {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("data", data));
    }

    // ═══════════════════════════════════════════════════════════
    //  9.3  GET /api/v1/organizations/dashboard/getIncomeByCategoryChart
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getIncomeByCategoryChart(Integer orgId,
                                                   LocalDate startDate,
                                                   LocalDate endDate) {
        LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfYear(1);
        LocalDate to   = endDate   != null ? endDate   : LocalDate.now();

        List<Map<String, Object>> data = new ArrayList<>();
        try {
            data = jdbc.query(
                "SELECT COALESCE(c.name_uz, 'Boshqa') AS category, " +
                "       COALESCE(SUM(p.amount), 0)    AS income " +
                "FROM payments p " +
                "LEFT JOIN categories c ON c.id = p.category_id " +
                "WHERE p.organization_id = ? " +
                "  AND p.payment_date::DATE BETWEEN ? AND ? " +
                "GROUP BY c.name_uz " +
                "ORDER BY income DESC",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("category", rs.getString("category"));
                    row.put("income",   rs.getBigDecimal("income"));
                    return row;
                }, orgId, from, to);
        } catch (Exception e) {
            log.debug("getIncomeByCategoryChart fallback: {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("data", data));
    }

    // ═══════════════════════════════════════════════════════════
    //  9.4  GET /api/v1/organizations/dashboard/getDailyEntriesChart
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getDailyEntriesChart(Integer orgId) {
        List<Map<String, Object>> data = new ArrayList<>();
        try {
            data = jdbc.query(
                "SELECT entry_time::DATE AS date, COUNT(*) AS entries " +
                "FROM entries " +
                "WHERE organization_id = ? " +
                "  AND entry_time >= CURRENT_DATE - INTERVAL '30 days' " +
                "GROUP BY entry_time::DATE " +
                "ORDER BY date ASC",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date",    rs.getDate("date").toString());
                    row.put("entries", rs.getLong("entries"));
                    return row;
                }, orgId);
        } catch (Exception e) {
            log.debug("getDailyEntriesChart fallback: {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("data", data));
    }

    // ═══════════════════════════════════════════════════════════
    //  9.5  GET /api/v1/organizations/dashboard/getTopDebtors
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getTopDebtors(Integer orgId, int limit) {
        List<Map<String, Object>> data = new ArrayList<>();
        try {
            data = jdbc.query(
                "SELECT id AS person_id, full_name AS fullname, " +
                "       photo_url, debt AS total_debt, phone_number " +
                "FROM persons " +
                "WHERE organization_id = ? " +
                "  AND deleted = false AND is_staff = false AND debt > 0 " +
                "ORDER BY debt DESC " +
                "LIMIT ?",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("personId",    rs.getLong("person_id"));
                    row.put("fullname",    rs.getString("fullname"));
                    row.put("photoUrl",    rs.getString("photo_url"));
                    row.put("totalDebt",   rs.getBigDecimal("total_debt"));
                    row.put("phoneNumber", rs.getString("phone_number"));
                    return row;
                }, orgId, limit);
        } catch (Exception e) {
            log.debug("getTopDebtors fallback: {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("data", data));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers – graceful degradation
    // ═══════════════════════════════════════════════════════════

    private long safeCount(String sql, Object param) {
        try {
            Long v = jdbc.queryForObject(sql, Long.class, param);
            return v != null ? v : 0L;
        } catch (Exception e) {
            log.debug("safeCount fallback: {}", e.getMessage());
            return 0L;
        }
    }

    private BigDecimal safeSum(String sql, Object param) {
        try {
            BigDecimal v = jdbc.queryForObject(sql, BigDecimal.class, param);
            return v != null ? v : BigDecimal.ZERO;
        } catch (Exception e) {
            log.debug("safeSum fallback: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }
}

