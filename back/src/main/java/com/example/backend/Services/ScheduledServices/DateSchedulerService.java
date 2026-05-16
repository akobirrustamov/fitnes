package com.example.backend.Services.ScheduledServices;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * DateSchedulerService – har oyning 1-kunida soat 02:00 da
 * keyingi oy uchun barcha tashkilotlarga dates yaratadi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DateSchedulerService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Har oyning 1-kunida soat 02:00 da ishga tushadi.
     * cron: s m h dayOfMonth month dayOfWeek
     */
    @Scheduled(cron = "0 0 2 1 * *")
    public void generateNextMonthDates() {
        // Keyingi oyni YYYYMM formatida hisoblash
        LocalDate nextMonth = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        int yyyymm = nextMonth.getYear() * 100 + nextMonth.getMonthValue();

        log.info("📅 DateSchedulerService ishga tushdi. Keyingi oy: {} ({})",
                nextMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy")), yyyymm);

        try {
            jdbcTemplate.execute("SELECT create_monthly_dates(" + yyyymm + ")");
            log.info("✅ Sanalar muvaffaqiyatli yaratildi: {}", yyyymm);
        } catch (Exception e) {
            log.error("❌ DateSchedulerService xatosi ({}): {}", yyyymm, e.getMessage(), e);
        }
    }

    /**
     * Joriy oy uchun sanalarni qo'lda yaratish (restart yoki manual trigger uchun)
     */
    public void generateForMonth(int yyyymm) {
        log.info("📅 Qo'lda sanalar yaratilmoqda: {}", yyyymm);
        try {
            jdbcTemplate.execute("SELECT create_monthly_dates(" + yyyymm + ")");
            log.info("✅ Sanalar yaratildi: {}", yyyymm);
        } catch (Exception e) {
            log.error("❌ Sanalar yaratishda xato ({}): {}", yyyymm, e.getMessage(), e);
            throw new RuntimeException("Sanalar yaratishda xatolik: " + e.getMessage(), e);
        }
    }
}

