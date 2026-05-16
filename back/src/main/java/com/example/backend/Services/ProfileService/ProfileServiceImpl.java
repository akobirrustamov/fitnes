package com.example.backend.Services.ProfileService;

import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Payload.req.ChangePasswordRequest;
import com.example.backend.Payload.req.ProfileUpdateRequest;
import com.example.backend.Payload.res.DirectorProfileResponse;
import com.example.backend.Payload.res.SuperAdminProfileResponse;
import com.example.backend.Repository.UserProfileRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.AuthService.AuthService;
import com.example.backend.Services.AuthService.RefreshTokenService;
import com.example.backend.exceptions.DuplicateNameException;
import com.example.backend.exceptions.OrganizationNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    private final AuthService authService;
    private final UserRepo userRepo;
    private final UserProfileRepo userProfileRepo;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    // ═══════════════════════════════════════════════════════════
    //  GET /api/v1/profile/view
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> view(String token) {
        User user = authService.decode(token);
        UserRoles roleEnum = resolveActiveRoleName(user);
        if (roleEnum == UserRoles.ROLE_SUPERADMIN) {
            return viewSuperAdmin(user);
        }
        return viewDirector(user);
    }

    private HttpEntity<?> viewDirector(User user) {
        UserProfile p = userProfileRepo.findByUser(user)
                .orElseThrow(() -> new OrganizationNotFoundException("A0075", "Tashkilot topilmadi."));
        Role activeRole = resolveActiveRole(user);

        return ResponseEntity.ok(DirectorProfileResponse.builder()
                .id(user.getNumber())
                .name(user.getName())
                .licenseKey(p.getLicenseKey())
                .productKey(p.getProductKey())
                .createdTime(user.getCreated_at())
                .directorName(p.getDirectorName())
                .login(user.getPhone())
                .password("")
                .passwordHint(p.getPasswordHint())
                .token("")
                .active(p.isActive())
                .deleted(p.isDeleted())
                .sourcePath(p.getSourcePath())
                .telegramBotActive(p.isTelegramBotActive())
                .phoneNumber(p.getPhoneNumber())
                .businessSphere(p.getBusinessSphere())
                .balance(p.getBalance() != null ? p.getBalance() : BigDecimal.ZERO)
                .updated(p.getUpdatedAt() != null)
                .roleId(activeRole != null ? activeRole.getId() : null)
                .sendTurn(p.getSendTurn())
                .photoUrl(p.getPhotoUrl())
                .lastLogin(p.getLastLogin())
                .regionId(p.getRegionId())
                .location(p.getLocation())
                .adminName(p.getAdminName())
                .adminPhoneNumber(p.getAdminPhoneNumber())
                .monitorId(p.getMonitorId())
                .build());
    }

    private HttpEntity<?> viewSuperAdmin(User user) {
        UserProfile p = userProfileRepo.findByUser(user)
                .orElseGet(() -> createDefaultProfile(user));
        Role activeRole = resolveActiveRole(user);

        return ResponseEntity.ok(SuperAdminProfileResponse.builder()
                .id(user.getNumber())
                .name(user.getName())
                .login(user.getPhone())
                .password("")
                .createdTime(user.getCreated_at())
                .passwordHint(p.getPasswordHint())
                .photoUrl(p.getPhotoUrl())
                .directorName(p.getDirectorName())
                .deleted(p.isDeleted())
                .token("")
                .phoneNumber(p.getPhoneNumber())
                .businessSphere(p.getBusinessSphere())
                .location(p.getLocation())
                .description(p.getDescription())
                .roleId(activeRole != null ? activeRole.getId() : null)
                .active(p.isActive())
                .lastLogin(p.getLastLogin())
                .build());
    }

    // ═══════════════════════════════════════════════════════════
    //  POST /api/v1/profile/update
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> update(String token, ProfileUpdateRequest request) {
        User user = authService.decode(token);

        // name bo'sh bo'lmasligi kerak
        if (request.getName() != null && request.getName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Name maydoni bo'sh bo'lishi mumkin emas."));
        }

        UserRoles roleEnum = resolveActiveRoleName(user);

        // Director uchun nomi unikal bo'lishi kerak
        if (roleEnum == UserRoles.ROLE_ADMIN && request.getName() != null) {
            if (userProfileRepo.existsByUser_NameAndUserIdNot(request.getName(), user.getId())) {
                throw new DuplicateNameException("A0087", "Tashkilot nomi allaqachon mavjud.");
            }
        }

        UserProfile profile;
        if (roleEnum == UserRoles.ROLE_ADMIN) {
            profile = userProfileRepo.findByUser(user)
                    .orElseThrow(() -> new OrganizationNotFoundException(
                            "A0086", "Tashkilot topilmadi yoki allaqachon o'chirilgan."));
            if (profile.isDeleted()) {
                throw new OrganizationNotFoundException(
                        "A0086", "Tashkilot topilmadi yoki allaqachon o'chirilgan.");
            }
        } else {
            profile = userProfileRepo.findByUser(user)
                    .orElseGet(() -> createDefaultProfile(user));
        }

        // User.name yangilanishi
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
            userRepo.save(user);
        }

        applyProfileUpdates(profile, request);
        profile.setUpdatedAt(LocalDateTime.now());
        userProfileRepo.save(profile);

        log.info("Profil yangilandi: userId={}, role={}", user.getId(), roleEnum);

        if (roleEnum == UserRoles.ROLE_ADMIN) {
            return ResponseEntity.ok(Map.of(
                    "organizationId", user.getNumber() != null ? user.getNumber() : 0,
                    "message", "Tashkilot muvaffaqiyatli yangilandi."));
        }
        return ResponseEntity.ok(Map.of(
                "userId", user.getNumber() != null ? user.getNumber() : 0,
                "message", "Foydalanuvchi muvaffaqiyatli yangilandi."));
    }

    // ═══════════════════════════════════════════════════════════
    //  POST /api/v1/profile/changePassword
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> changePassword(String token, ChangePasswordRequest request) {
        User user = authService.decode(token);
        if (user == null) {
            throw new OrganizationNotFoundException("A0095", "Parolni yangilash amalga oshmadi.");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepo.save(user);

        // Barcha qurilmalardan chiqarish
        refreshTokenService.revokeAllByUser(user);

        log.info("Parol o'zgartirildi, sessiyalar bekor: userId={}", user.getId());
        return ResponseEntity.ok(Map.of(
                "id", user.getNumber() != null ? user.getNumber() : 0,
                "message", "Parol muvaffaqiyatli o'zgartirildi."));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers
    // ═══════════════════════════════════════════════════════════

    private UserProfile createDefaultProfile(User user) {
        return userProfileRepo.save(UserProfile.builder()
                .user(user).active(true).deleted(false)
                .telegramBotActive(false).balance(BigDecimal.ZERO).build());
    }

    private void applyProfileUpdates(UserProfile p, ProfileUpdateRequest req) {
        if (req.getDirectorName() != null)   p.setDirectorName(req.getDirectorName());
        if (req.getPasswordHint() != null)   p.setPasswordHint(req.getPasswordHint());
        if (req.getBusinessSphere() != null) p.setBusinessSphere(req.getBusinessSphere());
        if (req.getPhoneNumber() != null)    p.setPhoneNumber(req.getPhoneNumber());
        if (req.getPhotoUrl() != null)       p.setPhotoUrl(req.getPhotoUrl());
        if (req.getSourcePath() != null)     p.setSourcePath(req.getSourcePath());
        if (req.getLocation() != null)       p.setLocation(req.getLocation());
        if (req.getDescription() != null)    p.setDescription(req.getDescription());
    }

    private UserRoles resolveActiveRoleName(User user) {
        Role r = resolveActiveRole(user);
        return r != null ? r.getName() : null;
    }

    private Role resolveActiveRole(User user) {
        if (user.getActiveRole() != null) return user.getActiveRole();
        if (user.getRoles() != null && !user.getRoles().isEmpty()) return user.getRoles().get(0);
        return null;
    }
}

