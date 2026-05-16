package com.example.backend.Services.ScheduledServices;

import com.example.backend.Repository.RefreshTokenRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * TokenCleanupService (TokenUpdater) – har 1 soatda bir marta
 * muddati tugagan va revoked tokenlarni o'chiradi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupService {

    private final RefreshTokenRepo refreshTokenRepo;

    /** 30 kundan eski revoked tokenlarni o'chirish */
    private static final int REVOKED_RETENTION_DAYS = 30;

    /**
     * Har soatda bir marta ishga tushadi
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("🔑 TokenCleanupService ishga tushdi...");

        LocalDateTime now    = LocalDateTime.now();
        LocalDateTime cutoff = now.minusDays(REVOKED_RETENTION_DAYS);

        // 1. Muddati tugagan tokenlarni o'chirish
        int expired = refreshTokenRepo.deleteExpiredTokens(now);

        // 2. Revoked va 30 kundan eski tokenlarni o'chirish
        int revoked = refreshTokenRepo.deleteOldRevokedTokens(cutoff);

        long total = refreshTokenRepo.count();

        log.info("✅ TokenCleanupService tugadi. " +
                 "O'chirildi (expired): {}, O'chirildi (revoked): {}, " +
                 "Qolgan tokenlar soni: {}",
                 expired, revoked, total);
    }
}

