package com.example.backend.Services.AuthService;

import com.example.backend.Entity.RefreshToken;
import com.example.backend.Entity.User;
import com.example.backend.Repository.RefreshTokenRepo;
import com.example.backend.exceptions.InvalidRefreshTokenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenServiceImpl implements RefreshTokenService {

    // Refresh token 30 kun amal qiladi
    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30;

    private final RefreshTokenRepo refreshTokenRepo;

    @Override
    @Transactional
    public RefreshToken create(User user) {
        RefreshToken rt = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRY_DAYS))
                .revoked(false)
                .createdAt(LocalDateTime.now())
                .build();
        return refreshTokenRepo.save(rt);
    }

    @Override
    public RefreshToken validateAndGet(String token) {
        RefreshToken rt = refreshTokenRepo.findByToken(token)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (rt.isRevoked()) {
            log.warn("⛔ Revoked refresh token ishlatildi: {}", token.substring(0, 8) + "...");
            throw new InvalidRefreshTokenException();
        }
        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("⛔ Muddati o'tgan refresh token: {}", token.substring(0, 8) + "...");
            throw new InvalidRefreshTokenException();
        }
        return rt;
    }

    @Override
    @Transactional
    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        refreshTokenRepo.save(token);
    }

    @Override
    @Transactional
    public void revokeAllByUser(User user) {
        refreshTokenRepo.revokeAllByUser(user);
        log.info("🔒 User {} uchun barcha refresh tokenlar revoke qilindi", user.getId());
    }
}

