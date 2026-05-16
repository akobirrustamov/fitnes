package com.example.backend.Services.DashboardService;

import org.springframework.http.HttpEntity;

import java.time.LocalDate;

public interface DashboardService {

    HttpEntity<?> getStats(Integer organizationId);

    HttpEntity<?> getMonthlyIncomeChart(Integer organizationId);

    HttpEntity<?> getIncomeByCategoryChart(Integer organizationId,
                                            LocalDate startDate,
                                            LocalDate endDate);

    HttpEntity<?> getDailyEntriesChart(Integer organizationId);

    HttpEntity<?> getTopDebtors(Integer organizationId, int limit);
}

