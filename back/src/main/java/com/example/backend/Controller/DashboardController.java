package com.example.backend.Controller;

import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.DashboardService.DashboardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * DashboardController – tashkilot (director) dashboard endpointlari.
 * Auth: JWT Bearer token (ROLE_ADMIN / director)
 */
@RestController
@RequestMapping("/api/v1/organizations/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final JwtService       jwtService;
    private final UserRepo         userRepo;

    // ─── Auth helper ───────────────────────────────────────────
    /**
     * Authorization headeridan org ID (users.number) olish.
     * Agar token yo'q yoki notog'ri bo'lsa - null qaytaradi.
     */
    private Integer resolveOrgId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try {
            String userId = jwtService.extractSubjectFromJwt(token);
            return userRepo.findById(UUID.fromString(userId))
                    .map(com.example.backend.Entity.User::getNumber)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Dashboard token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  9.1  GET /getStats
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/getStats")
    public HttpEntity<?> getStats(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return dashboardService.getStats(orgId);
    }

    // ═══════════════════════════════════════════════════════════
    //  9.2  GET /getMonthlyIncomeChart
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/getMonthlyIncomeChart")
    public HttpEntity<?> getMonthlyIncomeChart(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return dashboardService.getMonthlyIncomeChart(orgId);
    }

    // ═══════════════════════════════════════════════════════════
    //  9.3  GET /getIncomeByCategoryChart?startDate=&endDate=
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/getIncomeByCategoryChart")
    public HttpEntity<?> getIncomeByCategoryChart(
            HttpServletRequest request,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();

        LocalDate from = parseDate(startDate);
        LocalDate to   = parseDate(endDate);

        return dashboardService.getIncomeByCategoryChart(orgId, from, to);
    }

    // ═══════════════════════════════════════════════════════════
    //  9.4  GET /getDailyEntriesChart
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/getDailyEntriesChart")
    public HttpEntity<?> getDailyEntriesChart(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return dashboardService.getDailyEntriesChart(orgId);
    }

    // ═══════════════════════════════════════════════════════════
    //  9.5  GET /getTopDebtors?limit=10
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/getTopDebtors")
    public HttpEntity<?> getTopDebtors(
            HttpServletRequest request,
            @RequestParam(defaultValue = "10") int limit) {

        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return dashboardService.getTopDebtors(orgId, Math.max(1, Math.min(limit, 100)));
    }

    // ─── Helpers ──────────────────────────────────────────────
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }
}

