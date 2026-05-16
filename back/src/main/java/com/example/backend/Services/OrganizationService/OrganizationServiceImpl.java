package com.example.backend.Services.OrganizationService;

import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Payload.req.*;
import com.example.backend.Payload.res.OrganizationDetailResponse;
import com.example.backend.Payload.res.OrganizationListItem;
import com.example.backend.Payload.res.PagedResponse;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserProfileRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.AuthService.RefreshTokenService;
import com.example.backend.exceptions.CategoryValidationException;
import com.example.backend.exceptions.OrganizationNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationServiceImpl implements OrganizationService {

    private final UserRepo         userRepo;
    private final UserProfileRepo  userProfileRepo;
    private final RoleRepo         roleRepo;
    private final PasswordEncoder  passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    // ═══════════════════════════════════════════════════════════
    //  GET /api/v1/admin/organizations/getAll
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getAll(Integer provinceId, Integer regionId,
                                Boolean active, String search,
                                int page, int limit) {
        // Spring Pageable — 0-based, spec — 1-based
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), limit);

        Page<UserProfile> resultPage = userProfileRepo.findOrganizations(
                UserRoles.ROLE_ADMIN, regionId, provinceId, active,
                (search != null && search.isBlank()) ? null : search,
                pageable);

        List<OrganizationListItem> items = resultPage.getContent()
                .stream()
                .map(this::toListItem)
                .collect(Collectors.toList());

        PagedResponse<OrganizationListItem> response = new PagedResponse<>(
                items,
                resultPage.getTotalElements(),
                page,
                limit,
                resultPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    // ═══════════════════════════════════════════════════════════
    //  GET /api/v1/admin/organizations/getById?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getById(Integer id) {
        UserProfile profile = findProfileByNumber(id, "A0013");
        return ResponseEntity.ok(toDetailResponse(profile));
    }

    // ═══════════════════════════════════════════════════════════
    //  POST /api/v1/admin/organizations/create
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> create(OrganizationCreateRequest request) {

        // Validatsiya
        if (request.getName() == null || request.getName().isBlank()) {
            throw new CategoryValidationException("A0014",
                    "Name maydoni bo'sh bo'lishi mumkin emas");
        }
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            throw new CategoryValidationException("A0014",
                    "Login maydoni bo'sh bo'lishi mumkin emas");
        }

        // Login unikalligi
        if (userRepo.findByPhone(request.getLogin()).isPresent()) {
            throw new OrganizationNotFoundException("A0015",
                    "Bunday login allaqachon mavjud");
        }

        // Avtomatik parol
        String rawPassword = generatePassword();

        // Seriya raqam
        int nextNumber = userRepo.findMaxNumber().orElse(0) + 1;

        // ROLE_ADMIN ni topish
        Role adminRole = roleRepo.findByName(UserRoles.ROLE_ADMIN);

        // User yaratish
        User user = User.builder()
                .phone(request.getLogin())
                .name(request.getName())
                .password(passwordEncoder.encode(rawPassword))
                .number(nextNumber)
                .roles(List.of(adminRole))
                .created_at(LocalDateTime.now())
                .build();
        userRepo.save(user);

        // UserProfile yaratish
        UserProfile profile = UserProfile.builder()
                .user(user)
                .directorName(request.getDirectorName())
                .phoneNumber(request.getPhoneNumber())
                .regionId(request.getRegionId())
                .regionName(request.getRegionName())
                .provinceId(request.getProvinceId())
                .businessSphere(request.getBusinessSphere())
                .location(request.getLocation())
                .passwordHint(request.getPasswordHint())
                .active(true)
                .deleted(false)
                .telegramBotActive(false)
                .balance(BigDecimal.ZERO)
                .build();
        userProfileRepo.save(profile);

        log.info("Tashkilot yaratildi: id={}, login={}", nextNumber, request.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "organizationId", nextNumber,
                        "password",       rawPassword,
                        "message",        "Tashkilot muvaffaqiyatli yaratildi"
                ));
    }

    // ═══════════════════════════════════════════════════════════
    //  PUT /api/v1/admin/organizations/update?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> update(Integer id, OrganizationUpdateRequest request) {
        UserProfile profile = findProfileByNumber(id, "A0016");
        User user = profile.getUser();

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
            userRepo.save(user);
        }

        if (request.getDirectorName()    != null) profile.setDirectorName(request.getDirectorName());
        if (request.getPhoneNumber()     != null) profile.setPhoneNumber(request.getPhoneNumber());
        if (request.getBusinessSphere()  != null) profile.setBusinessSphere(request.getBusinessSphere());
        if (request.getLocation()        != null) profile.setLocation(request.getLocation());
        if (request.getPasswordHint()    != null) profile.setPasswordHint(request.getPasswordHint());
        if (request.getRegionId()        != null) profile.setRegionId(request.getRegionId());
        if (request.getRegionName()      != null) profile.setRegionName(request.getRegionName());
        if (request.getProvinceId()      != null) profile.setProvinceId(request.getProvinceId());
        if (request.getPhotoUrl()        != null) profile.setPhotoUrl(request.getPhotoUrl());
        if (request.getSourcePath()      != null) profile.setSourcePath(request.getSourcePath());
        if (request.getAdminName()       != null) profile.setAdminName(request.getAdminName());
        if (request.getAdminPhoneNumber()!= null) profile.setAdminPhoneNumber(request.getAdminPhoneNumber());
        if (request.getSendTurn()        != null) profile.setSendTurn(request.getSendTurn());
        if (request.getMonitorId()       != null) profile.setMonitorId(request.getMonitorId());

        profile.setUpdatedAt(LocalDateTime.now());
        userProfileRepo.save(profile);

        log.info("Tashkilot yangilandi: id={}", id);
        return ResponseEntity.ok(Map.of("organizationId", id,
                                        "message", "Tashkilot muvaffaqiyatli yangilandi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  PUT /api/v1/admin/organizations/setActive?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> setActive(Integer id, SetActiveRequest request) {
        UserProfile profile = findProfileByNumber(id, "A0013");
        profile.setActive(request.isActive());
        userProfileRepo.save(profile);

        String msg = request.isActive() ? "Tashkilot faollashtirildi" : "Tashkilot bloklandi";
        log.info("{}: id={}", msg, id);

        return ResponseEntity.ok(Map.of(
                "organizationId", id,
                "active",         request.isActive(),
                "message",        msg
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  PUT /api/v1/admin/organizations/changePassword?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> changePassword(Integer id, ChangeOrgPasswordRequest request) {
        UserProfile profile = findProfileByNumber(id, "A0013");
        User user = profile.getUser();

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        if (request.getPasswordHint() != null) {
            profile.setPasswordHint(request.getPasswordHint());
            userProfileRepo.save(profile);
        }

        // Barcha qurilmalardan chiqarish
        refreshTokenService.revokeAllByUser(user);

        log.info("Tashkilot paroli o'zgartirildi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "organizationId", id,
                "message",        "Parol muvaffaqiyatli o'zgartirildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  DELETE /api/v1/admin/organizations/delete?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> delete(Integer id) {
        UserProfile profile = userRepo.findByNumber(id)
                .flatMap(u -> userProfileRepo.findByUser(u))
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new OrganizationNotFoundException(
                        "A0017", "Tashkilot topilmadi yoki allaqachon o'chirilgan"));

        profile.setDeleted(true);
        profile.setActive(false);
        userProfileRepo.save(profile);

        log.info("Tashkilot soft-deleted: id={}", id);
        return ResponseEntity.ok(Map.of(
                "message", "Tashkilot muvaffaqiyatli o'chirildi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers
    // ═══════════════════════════════════════════════════════════

    /** user.number bo'yicha UserProfile topadi, yo'q bo'lsa exception */
    private UserProfile findProfileByNumber(Integer number, String errorCode) {
        User user = userRepo.findByNumber(number)
                .orElseThrow(() -> new OrganizationNotFoundException(
                        errorCode, "Tashkilot topilmadi"));
        return userProfileRepo.findByUser(user)
                .orElseThrow(() -> new OrganizationNotFoundException(
                        errorCode, "Tashkilot topilmadi"));
    }

    /** UserProfile → ro'yxat elementi */
    private OrganizationListItem toListItem(UserProfile p) {
        return OrganizationListItem.builder()
                .id(p.getUser().getNumber())
                .name(p.getUser().getName())
                .directorName(p.getDirectorName())
                .login(p.getUser().getPhone())
                .phoneNumber(p.getPhoneNumber())
                .businessSphere(p.getBusinessSphere())
                .regionId(p.getRegionId())
                .regionName(p.getRegionName())
                .monitorId(p.getMonitorId())
                .active(p.isActive())
                .balance(p.getBalance())
                .createdTime(p.getUser().getCreated_at())
                .lastLogin(p.getLastLogin())
                .build();
    }

    /** UserProfile → to'liq detail response */
    private OrganizationDetailResponse toDetailResponse(UserProfile p) {
        User u = p.getUser();
        Role role = (u.getActiveRole() != null) ? u.getActiveRole()
                    : (u.getRoles() != null && !u.getRoles().isEmpty()) ? u.getRoles().get(0) : null;

        return OrganizationDetailResponse.builder()
                .id(u.getNumber())
                .name(u.getName())
                .licenseKey(p.getLicenseKey())
                .productKey(p.getProductKey())
                .createdTime(u.getCreated_at())
                .directorName(p.getDirectorName())
                .login(u.getPhone())
                .passwordHint(p.getPasswordHint())
                .active(p.isActive())
                .deleted(p.isDeleted())
                .sourcePath(p.getSourcePath())
                .telegramBotActive(p.isTelegramBotActive())
                .phoneNumber(p.getPhoneNumber())
                .businessSphere(p.getBusinessSphere())
                .balance(p.getBalance() != null ? p.getBalance() : BigDecimal.ZERO)
                .updated(p.getUpdatedAt() != null)
                .roleId(role != null ? role.getId() : null)
                .sendTurn(p.getSendTurn())
                .photoUrl(p.getPhotoUrl())
                .lastLogin(p.getLastLogin())
                .regionId(p.getRegionId())
                .regionName(p.getRegionName())
                .location(p.getLocation())
                .adminName(p.getAdminName())
                .adminPhoneNumber(p.getAdminPhoneNumber())
                .monitorId(p.getMonitorId())
                .build();
    }

    private String generatePassword() {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random rnd = new Random();
        for (int i = 0; i < 9; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }
}

