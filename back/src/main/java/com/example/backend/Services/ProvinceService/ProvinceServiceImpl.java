package com.example.backend.Services.ProvinceService;

import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Payload.req.ProvinceChangePasswordRequest;
import com.example.backend.Payload.req.ProvinceCreateRequest;
import com.example.backend.Payload.req.ProvinceUpdateRequest;
import com.example.backend.Payload.res.ProvinceDetailResponse;
import com.example.backend.Payload.res.ProvinceListItem;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserProfileRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.AuthService.RefreshTokenService;
import com.example.backend.exceptions.ProvinceHasRegionsException;
import com.example.backend.exceptions.ProvinceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProvinceServiceImpl implements ProvinceService {

    private final UserRepo userRepo;
    private final UserProfileRepo userProfileRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    // ═══════════════════════════════════════════════════════════
    //  8.1 GET /api/v1/admin/provinces/getAll
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getAll(Boolean active) {
        List<UserProfile> profiles = userProfileRepo.findProvincesAll(UserRoles.ROLE_PROVINCE, active);
        List<ProvinceListItem> items = profiles.stream().map(this::toListItem).collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    // ═══════════════════════════════════════════════════════════
    //  8.2 GET /api/v1/admin/provinces/getById/{id}
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getById(Integer id) {
        UserProfile profile = findProvinceProfileByNumber(id, "A0022");
        return ResponseEntity.ok(toDetailResponse(profile));
    }

    // ═══════════════════════════════════════════════════════════
    //  8.3 POST /api/v1/admin/provinces/add
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> add(ProvinceCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0025", "message", "Name maydoni bo'sh bo'lishi mumkin emas"));
        }
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0025", "message", "Login maydoni bo'sh bo'lishi mumkin emas"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0025", "message", "Password maydoni bo'sh bo'lishi mumkin emas"));
        }

        // Login unikalligi tekshirish
        if (userRepo.findByPhone(request.getLogin()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "A0023", "message", "Bunday login allaqachon mavjud"));
        }

        int nextNumber = userRepo.findMaxNumber().orElse(0) + 1;
        Role provinceRole = roleRepo.findByName(UserRoles.ROLE_PROVINCE);

        User user = User.builder()
                .phone(request.getLogin())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .number(nextNumber)
                .roles(List.of(provinceRole))
                .created_at(LocalDateTime.now())
                .build();
        userRepo.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .directorName(request.getDirectorName())
                .phoneNumber(request.getPhoneNumber())
                .location(request.getLocation())
                .description(request.getDescription())
                .businessSphere(request.getBusinessSphere())
                .passwordHint(request.getPasswordHint())
                .active(true)
                .deleted(false)
                .telegramBotActive(false)
                .build();
        userProfileRepo.save(profile);

        log.info("Viloyat yaratildi: id={}, login={}", nextNumber, request.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "provinceId", nextNumber,
                "message",    "Viloyat muvaffaqiyatli yaratildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  8.4 PUT /api/v1/admin/provinces/update?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> update(Integer id, ProvinceUpdateRequest request) {
        UserProfile profile = findProvinceProfileByNumber(id, "A0022");
        User user = profile.getUser();

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
            userRepo.save(user);
        }
        if (request.getDirectorName()   != null) profile.setDirectorName(request.getDirectorName());
        if (request.getPhoneNumber()    != null) profile.setPhoneNumber(request.getPhoneNumber());
        if (request.getLocation()       != null) profile.setLocation(request.getLocation());
        if (request.getDescription()    != null) profile.setDescription(request.getDescription());
        if (request.getBusinessSphere() != null) profile.setBusinessSphere(request.getBusinessSphere());
        if (request.getPasswordHint()   != null) profile.setPasswordHint(request.getPasswordHint());
        if (request.getPhotoUrl()       != null) profile.setPhotoUrl(request.getPhotoUrl());

        profile.setUpdatedAt(LocalDateTime.now());
        userProfileRepo.save(profile);

        log.info("Viloyat yangilandi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "provinceId", id,
                "message",    "Viloyat muvaffaqiyatli yangilandi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  8.5 DELETE /api/v1/admin/provinces/delete?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> delete(Integer id) {
        UserProfile profile = userRepo.findByNumber(id)
                .flatMap(userProfileRepo::findByUser)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ProvinceNotFoundException(
                        "A0022", "Viloyat topilmadi yoki allaqachon o'chirilgan"));

        // Bu viloyatda faol tumanlar bormi?
        boolean hasRegions = userProfileRepo.existsActiveRegionByProvinceId(
                UserRoles.ROLE_REGION, id);
        if (hasRegions) {
            throw new ProvinceHasRegionsException(
                    "A0024", "Bu viloyatda tumanlar mavjud. Avval tumanlarni o'chiring.");
        }

        profile.setDeleted(true);
        profile.setActive(false);
        userProfileRepo.save(profile);

        log.info("Viloyat soft-deleted: id={}", id);
        return ResponseEntity.ok(Map.of("message", "Viloyat muvaffaqiyatli o'chirildi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  8.6 GET /api/v1/admin/provinces/setActive?id=&active=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> setActive(Integer id, Boolean active) {
        UserProfile profile = findProvinceProfileByNumber(id, "A0022");
        profile.setActive(active);
        userProfileRepo.save(profile);

        String msg = active ? "Viloyat faollashtirildi" : "Viloyat bloklandi";
        log.info("{}: id={}", msg, id);
        return ResponseEntity.ok(Map.of(
                "provinceId", id,
                "active",     active,
                "message",    msg
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  8.7 GET /api/v1/admin/provinces/download
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> download(Boolean active) {
        List<UserProfile> provinces = userProfileRepo.findProvincesAll(UserRoles.ROLE_PROVINCE, active);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Provinces");

            // Header row
            Row header = sheet.createRow(0);
            String[] cols = {"ID", "Name", "Login", "Director Name", "Phone Number",
                    "Active", "Created Time", "Last Login"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (UserProfile up : provinces) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(up.getUser().getNumber() != null ? up.getUser().getNumber() : 0);
                row.createCell(1).setCellValue(up.getUser().getName() != null ? up.getUser().getName() : "");
                row.createCell(2).setCellValue(up.getUser().getPhone() != null ? up.getUser().getPhone() : "");
                row.createCell(3).setCellValue(up.getDirectorName() != null ? up.getDirectorName() : "");
                row.createCell(4).setCellValue(up.getPhoneNumber() != null ? up.getPhoneNumber() : "");
                row.createCell(5).setCellValue(up.isActive() ? "Ha" : "Yo'q");
                row.createCell(6).setCellValue(up.getUser().getCreated_at() != null
                        ? up.getUser().getCreated_at().format(fmt) : "");
                row.createCell(7).setCellValue(up.getLastLogin() != null
                        ? up.getLastLogin().format(fmt) : "");
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] bytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("provinces_" + LocalDateTime.now()
                            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx")
                    .build());
            headers.setContentLength(bytes.length);

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            log.error("Excel yaratishda xato", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  8.8 POST /api/v1/admin/provinces/changePassword/{id}
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> changePassword(Integer id, ProvinceChangePasswordRequest request) {
        UserProfile profile = findProvinceProfileByNumber(id, "A0022");
        User user = profile.getUser();

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepo.save(user);

        // Barcha qurilmalardan chiqarish
        refreshTokenService.revokeAllByUser(user);

        log.info("Viloyat paroli o'zgartirildi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "provinceId", id,
                "message",    "Parol muvaffaqiyatli o'zgartirildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers
    // ═══════════════════════════════════════════════════════════

    private UserProfile findProvinceProfileByNumber(Integer number, String errorCode) {
        User user = userRepo.findByNumber(number)
                .orElseThrow(() -> new ProvinceNotFoundException(errorCode, "Viloyat topilmadi"));
        return userProfileRepo.findByUser(user)
                .orElseThrow(() -> new ProvinceNotFoundException(errorCode, "Viloyat topilmadi"));
    }

    private ProvinceListItem toListItem(UserProfile p) {
        return ProvinceListItem.builder()
                .id(p.getUser().getNumber())
                .name(p.getUser().getName())
                .login(p.getUser().getPhone())
                .directorName(p.getDirectorName())
                .phoneNumber(p.getPhoneNumber())
                .active(p.isActive())
                .createdTime(p.getUser().getCreated_at())
                .lastLogin(p.getLastLogin())
                .build();
    }

    private ProvinceDetailResponse toDetailResponse(UserProfile p) {
        User u = p.getUser();
        Role role = (u.getActiveRole() != null) ? u.getActiveRole()
                : (u.getRoles() != null && !u.getRoles().isEmpty()) ? u.getRoles().get(0) : null;

        return ProvinceDetailResponse.builder()
                .id(u.getNumber())
                .name(u.getName())
                .login(u.getPhone())
                .directorName(p.getDirectorName())
                .phoneNumber(p.getPhoneNumber())
                .location(p.getLocation())
                .description(p.getDescription())
                .businessSphere(p.getBusinessSphere())
                .photoUrl(p.getPhotoUrl())
                .passwordHint(p.getPasswordHint())
                .active(p.isActive())
                .deleted(p.isDeleted())
                .roleId(role != null ? role.getId() : null)
                .createdTime(u.getCreated_at())
                .lastLogin(p.getLastLogin())
                .build();
    }
}

