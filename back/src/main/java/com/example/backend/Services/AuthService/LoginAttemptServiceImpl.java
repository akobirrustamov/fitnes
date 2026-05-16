package com.example.backend.Services.AuthService;

import com.example.backend.Entity.LoginAttempt;
import com.example.backend.Repository.LoginAttemptRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginAttemptServiceImpl implements LoginAttemptService {

    // 5 ta xato → 5 daqiqa blok; har qo'shimcha xato uchun +5 daqiqa
    private static final int MAX_ATTEMPTS_BEFORE_BLOCK = 5;
    private static final int BASE_BLOCK_MINUTES = 5;

    private final LoginAttemptRepo loginAttemptRepo;

    @Override
    @Transactional
    public void recordFailedAttempt(String login) {
        LoginAttempt attempt = loginAttemptRepo.findByLogin(login)
                .orElse(LoginAttempt.builder()
                        .login(login)
                        .attemptCount(0)
                        .build());

        attempt.setAttemptCount(attempt.getAttemptCount() + 1);
        attempt.setLastAttemptAt(LocalDateTime.now());

        // 5-urinishdan boshlab bloklay boshlaydi
        if (attempt.getAttemptCount() >= MAX_ATTEMPTS_BEFORE_BLOCK) {
            // Blok muddati: (attemptCount - 4) * 5  daqiqa
            // 5-urinish → 5 min, 6-urinish → 10 min, 7-urinish → 15 min ...
            long blockMinutes = (long) (attempt.getAttemptCount() - (MAX_ATTEMPTS_BEFORE_BLOCK - 1)) * BASE_BLOCK_MINUTES;
            attempt.setBlockedUntil(LocalDateTime.now().plusMinutes(blockMinutes));
            log.warn("⛔ Login '{}' bloklandi {} daqiqaga. Urinish #{}", login, blockMinutes, attempt.getAttemptCount());
        }

        loginAttemptRepo.save(attempt);
    }

    @Override
    public boolean isBlocked(String login) {
        Optional<LoginAttempt> opt = loginAttemptRepo.findByLogin(login);
        if (opt.isEmpty()) return false;
        LoginAttempt attempt = opt.get();
        if (attempt.getBlockedUntil() == null) return false;
        return LocalDateTime.now().isBefore(attempt.getBlockedUntil());
    }

    @Override
    public long getRemainingBlockMinutes(String login) {
        Optional<LoginAttempt> opt = loginAttemptRepo.findByLogin(login);
        if (opt.isEmpty()) return 0;
        LoginAttempt attempt = opt.get();
        if (attempt.getBlockedUntil() == null) return 0;
        long remaining = ChronoUnit.MINUTES.between(LocalDateTime.now(), attempt.getBlockedUntil());
        return Math.max(1, remaining); // kamida 1 daqiqa ko'rsatish
    }

    @Override
    @Transactional
    public void clearAttempts(String login) {
        loginAttemptRepo.findByLogin(login).ifPresent(attempt -> {
            attempt.setAttemptCount(0);
            attempt.setBlockedUntil(null);
            loginAttemptRepo.save(attempt);
            log.info("✅ Login '{}' urinish hisobi tozalandi", login);
        });
    }
}

