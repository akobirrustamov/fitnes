package com.example.backend.Services.AuthService;

import com.example.backend.DTO.UserDTO;
import com.example.backend.Entity.*;
import com.example.backend.Payload.req.LoginRequest;
import com.example.backend.Payload.req.RefreshTokenRequest;
import com.example.backend.Payload.res.LoginResponse;
import com.example.backend.Payload.res.RefreshTokenResponse;
import com.example.backend.Repository.PasswordResetRequestRepo;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.exceptions.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;
    private final RefreshTokenService refreshTokenService;
    private final SmsService smsService;
    private final PasswordResetRequestRepo passwordResetRequestRepo;

    // ═══════════════════════════════════════════════════════════════
    //  1. POST /api/v1/auth/login
    // ═══════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> login(LoginRequest request) {
        String username = request.getUsername();

        // 1) Blok tekshiruvi
        if (loginAttemptService.isBlocked(username)) {
            long remaining = loginAttemptService.getRemainingBlockMinutes(username);
            throw new LoginBlockedException(remaining);
        }

        // 2) User izlash
        Optional<User> userOpt = userRepo.findByPhone(username);
        if (userOpt.isEmpty()) {
            recordAndCheckBlock(username);
            throw new InvalidCredentialsException();
        }

        // 3) Parol tekshiruvi
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );
        } catch (BadCredentialsException e) {
            recordAndCheckBlock(username);
            throw new InvalidCredentialsException();
        }

        // 4) Muvaffaqiyatli kirish
        User user = userOpt.get();
        loginAttemptService.clearAttempts(username);

        // Eski refresh tokenlarni bekor qilish
        refreshTokenService.revokeAllByUser(user);

        // Yangi tokenlar generatsiya
        String accessToken = jwtService.generateJwtToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user);

        // Active role
        Role activeRole = resolveActiveRole(user);

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .roleId(activeRole != null ? activeRole.getId() : 0)
                .roleName(activeRole != null ? activeRole.getName().name() : "UNKNOWN")
                .expiresIn(JwtService.ACCESS_TOKEN_EXPIRY_SECONDS)
                .build();

        log.info("✅ Foydalanuvchi kirdi: {}", username);
        return ResponseEntity.ok(response);
    }

    // ═══════════════════════════════════════════════════════════════
    //  2. POST /api/v1/auth/refreshToken  (body: {refreshToken})
    // ═══════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> refreshToken(RefreshTokenRequest request) {
        RefreshToken existing = refreshTokenService.validateAndGet(request.getRefreshToken());
        User user = existing.getUser();

        // Token rotation: eskisini revoke qil, yangisini yarat
        refreshTokenService.revoke(existing);
        String newAccessToken = jwtService.generateJwtToken(user);
        RefreshToken newRefreshToken = refreshTokenService.create(user);

        return ResponseEntity.ok(RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .expiresIn(JwtService.ACCESS_TOKEN_EXPIRY_SECONDS)
                .build());
    }

    // ═══════════════════════════════════════════════════════════════
    //  3. POST /api/v1/auth/logOut  (header: token)
    // ═══════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> logOut(String token) {
        try {
            if (jwtService.validateToken(token)) {
                String userId = jwtService.extractSubjectFromJwt(token);
                userRepo.findById(UUID.fromString(userId)).ifPresent(user -> {
                    refreshTokenService.revokeAllByUser(user);
                    log.info("🚪 Foydalanuvchi chiqdi: {}", user.getPhone());
                });
            }
        } catch (Exception e) {
            log.warn("LogOut paytida xato (ignored): {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("message", "Tizimdan muvaffaqiyatli chiqildi"));
    }

    // ═══════════════════════════════════════════════════════════════
    //  4. GET /api/v1/auth/changePasswordRequest?login=
    // ═══════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> changePasswordRequest(String login) {
        User user = userRepo.findByPhone(login)
                .orElseThrow(() -> new UserNotFoundException("Bunday login topilmadi"));

        // 4 xonali tasodifiy kod
        String smsCode = String.format("%04d", new Random().nextInt(10000));

        PasswordResetRequest resetRequest = PasswordResetRequest.builder()
                .login(login)
                .user(user)
                .smsCode(smsCode)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        PasswordResetRequest saved = passwordResetRequestRepo.save(resetRequest);

        // SMS yuborish
        smsService.sendSms(user.getPhone(), "FitCRM: Parol tiklash kodi: " + smsCode + " (10 daqiqa amal qiladi)");

        return ResponseEntity.ok(Map.of(
                "reqId", saved.getId(),
                "message", "SMS kod yuborildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════════
    //  5. GET /api/v1/auth/acceptSmsCode?reqid=&code=
    // ═══════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> acceptSmsCode(Long reqId, String code) {
        PasswordResetRequest resetRequest = passwordResetRequestRepo.findById(reqId)
                .orElseThrow(InvalidSmsCodeException::new);

        if (resetRequest.isUsed())
            throw new InvalidSmsCodeException();
        if (resetRequest.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new InvalidSmsCodeException();
        if (!resetRequest.getSmsCode().equals(code))
            throw new InvalidSmsCodeException();

        // Foydalanildi deb belgilash
        resetRequest.setUsed(true);
        passwordResetRequestRepo.save(resetRequest);

        // Yangi tasodifiy parol
        String newPassword = generateRandomPassword();

        User user = resetRequest.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        log.info("🔑 Parol tiklandi: {}", user.getPhone());
        return ResponseEntity.ok(Map.of(
                "newPassword", newPassword,
                "message", "Parol muvaffaqiyatli tiklandi"
        ));
    }

    // ═══════════════════════════════════════════════════════════════
    //  Legacy metodlar (backward-compat)
    // ═══════════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> login(UserDTO userDTO) {
        Optional<User> userOpt = userRepo.findByPhone(userDTO.getPhone());
        if (userOpt.isEmpty()) throw new InvalidCredentialsException();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(userDTO.getPhone(), userDTO.getPassword()));
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException();
        }

        User user = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("access_token", jwtService.generateJwtToken(user));
        if (userDTO.isRememberMe()) {
            RefreshToken rt = refreshTokenService.create(user);
            response.put("refresh_token", rt.getToken());
        }
        response.put("roles", user.getRoles());
        return ResponseEntity.ok(response);
    }

    @Override
    public HttpEntity<?> refreshToken(String refreshToken) {
        RefreshTokenRequest req = new RefreshTokenRequest(refreshToken);
        return refreshToken(req);
    }

    @Override
    public User decode(String token) {
        String raw = token.startsWith("Bearer ") ? token.substring(7) : token;
        if (!jwtService.validateToken(raw)) {
            throw new RuntimeException("Token is expired or invalid");
        }
        String userId = jwtService.extractSubjectFromJwt(raw);
        return userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User password(UUID adminId, String password) {
        User user = userRepo.findById(adminId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(password));
        return userRepo.save(user);
    }

    @Override
    public User changeRole(String token, Integer roleId) {
        User user = decode(token);
        Role role = roleRepo.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        user.setActiveRole(role);
        return userRepo.save(user);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Private yordamchi metodlar
    // ═══════════════════════════════════════════════════════════════

    /** Muvaffaqiyatsiz urinishni qayd etib, blok tekshirlaydi */
    private void recordAndCheckBlock(String username) {
        loginAttemptService.recordFailedAttempt(username);
        if (loginAttemptService.isBlocked(username)) {
            long remaining = loginAttemptService.getRemainingBlockMinutes(username);
            throw new LoginBlockedException(remaining);
        }
    }

    /** User-ning active role-ini aniqlaydi */
    private Role resolveActiveRole(User user) {
        if (user.getActiveRole() != null) return user.getActiveRole();
        if (user.getRoles() != null && !user.getRoles().isEmpty()) return user.getRoles().get(0);
        return null;
    }

    /** 9 ta belgilik tasodifiy parol generatsiya qiladi */
    private String generateRandomPassword() {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 9; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
