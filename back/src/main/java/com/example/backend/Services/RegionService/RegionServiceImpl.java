package com.example.backend.Services.RegionService;

import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Payload.req.RegionChangePasswordRequest;
import com.example.backend.Payload.req.RegionCreateRequest;
import com.example.backend.Payload.req.RegionUpdateRequest;
import com.example.backend.Payload.res.RegionDetailResponse;
import com.example.backend.Payload.res.RegionListItem;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserProfileRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.AuthService.RefreshTokenService;
import com.example.backend.exceptions.OrganizationNotFoundException;
import com.example.backend.exceptions.RegionNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
public class RegionServiceImpl implements RegionService {

    private final UserRepo userRepo;
    private final UserProfileRepo userProfileRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    // ═══════════════════════════════════════════════════════════
    //  7.1 GET /api/v1/admin/regions/getAll
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getAll(String part, Boolean active, Integer provinceId, int page, int pageSize) {
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), pageSize);
        String partParam = (part != null && !part.isBlank()) ? part : null;

        Page<UserProfile> resultPage = userProfileRepo.findRegions(
                UserRoles.ROLE_REGION, provinceId, active, partParam, pageable);

        List<RegionListItem> items = resultPage.getContent()
                .stream()
                .map(this::toListItem)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "data",       items,
                "totalCount", resultPage.getTotalElements(),
                "page",       page,
                "pageSize",   pageSize
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.2 GET /api/v1/admin/regions/getById/{id}
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getById(Integer id) {
        UserProfile profile = findRegionProfileByNumber(id, "A0020");
        return ResponseEntity.ok(toDetailResponse(profile));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.3 POST /api/v1/admin/regions/add
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> add(RegionCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0022", "message", "Name maydoni bo'sh bo'lishi mumkin emas"));
        }
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0022", "message", "Login maydoni bo'sh bo'lishi mumkin emas"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0022", "message", "Password maydoni bo'sh bo'lishi mumkin emas"));
        }

        // Login unikalligi
        if (userRepo.findByPhone(request.getLogin()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "A0021", "message", "Bunday login allaqachon mavjud"));
        }

        int nextNumber = userRepo.findMaxNumber().orElse(0) + 1;
        Role regionRole = roleRepo.findByName(UserRoles.ROLE_REGION);

        User user = User.builder()
                .phone(request.getLogin())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .number(nextNumber)
                .roles(List.of(regionRole))
                .created_at(LocalDateTime.now())
                .build();
        userRepo.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .directorName(request.getDirectorName())
                .phoneNumber(request.getPhoneNumber())
                .provinceId(request.getProvinceId())
                .provinceName(request.getProvinceName())
                .location(request.getLocation())
                .description(request.getDescription())
                .businessSphere(request.getBusinessSphere())
                .passwordHint(request.getPasswordHint())
                .active(true)
                .deleted(false)
                .telegramBotActive(false)
                .build();
        userProfileRepo.save(profile);

        log.info("Tuman yaratildi: id={}, login={}", nextNumber, request.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "regionId", nextNumber,
                "message",  "Tuman muvaffaqiyatli yaratildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.4 PUT /api/v1/admin/regions/update?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> update(Integer id, RegionUpdateRequest request) {
        UserProfile profile = findRegionProfileByNumber(id, "A0020");
        User user = profile.getUser();

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
            userRepo.save(user);
        }
        if (request.getDirectorName()  != null) profile.setDirectorName(request.getDirectorName());
        if (request.getPhoneNumber()   != null) profile.setPhoneNumber(request.getPhoneNumber());
        if (request.getLocation()      != null) profile.setLocation(request.getLocation());
        if (request.getDescription()   != null) profile.setDescription(request.getDescription());
        if (request.getBusinessSphere()!= null) profile.setBusinessSphere(request.getBusinessSphere());
        if (request.getPasswordHint()  != null) profile.setPasswordHint(request.getPasswordHint());
        if (request.getPhotoUrl()      != null) profile.setPhotoUrl(request.getPhotoUrl());

        profile.setUpdatedAt(LocalDateTime.now());
        userProfileRepo.save(profile);

        log.info("Tuman yangilandi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "regionId", id,
                "message",  "Tuman muvaffaqiyatli yangilandi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.5 DELETE /api/v1/admin/regions/delete?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> delete(Integer id) {
        UserProfile profile = userRepo.findByNumber(id)
                .flatMap(userProfileRepo::findByUser)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new RegionNotFoundException(
                        "A0020", "Tuman topilmadi yoki allaqachon o'chirilgan"));

        profile.setDeleted(true);
        profile.setActive(false);
        userProfileRepo.save(profile);

        log.info("Tuman soft-deleted: id={}", id);
        return ResponseEntity.ok(Map.of("message", "Tuman muvaffaqiyatli o'chirildi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.6 GET /api/v1/admin/regions/setActive?id=&active=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> setActive(Integer id, Boolean active) {
        UserProfile profile = findRegionProfileByNumber(id, "A0020");
        profile.setActive(active);
        userProfileRepo.save(profile);

        String msg = active ? "Tuman faollashtirildi" : "Tuman bloklandi";
        log.info("{}: id={}", msg, id);
        return ResponseEntity.ok(Map.of(
                "regionId", id,
                "active",   active,
                "message",  msg
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.7 GET /api/v1/admin/regions/download
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> download(String part, Boolean active, Integer provinceId) {
        String partParam = (part != null && !part.isBlank()) ? part : null;
        List<UserProfile> regions = userProfileRepo.findRegionsAll(
                UserRoles.ROLE_REGION, provinceId, active, partParam);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Regions");

            // Header row
            Row header = sheet.createRow(0);
            String[] cols = {"ID", "Name", "Login", "Director Name", "Phone Number",
                    "Province ID", "Province Name", "Active", "Created Time", "Last Login"};
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
            for (UserProfile up : regions) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(up.getUser().getNumber() != null ? up.getUser().getNumber() : 0);
                row.createCell(1).setCellValue(up.getUser().getName() != null ? up.getUser().getName() : "");
                row.createCell(2).setCellValue(up.getUser().getPhone() != null ? up.getUser().getPhone() : "");
                row.createCell(3).setCellValue(up.getDirectorName() != null ? up.getDirectorName() : "");
                row.createCell(4).setCellValue(up.getPhoneNumber() != null ? up.getPhoneNumber() : "");
                row.createCell(5).setCellValue(up.getProvinceId() != null ? up.getProvinceId() : 0);
                row.createCell(6).setCellValue(up.getProvinceName() != null ? up.getProvinceName() : "");
                row.createCell(7).setCellValue(up.isActive() ? "Ha" : "Yo'q");
                row.createCell(8).setCellValue(up.getUser().getCreated_at() != null
                        ? up.getUser().getCreated_at().format(fmt) : "");
                row.createCell(9).setCellValue(up.getLastLogin() != null
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
                    .filename("regions_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx")
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
    //  7.8 POST /api/v1/admin/regions/changePassword/{id}
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> changePassword(Integer id, RegionChangePasswordRequest request) {
        UserProfile profile = findRegionProfileByNumber(id, "A0020");
        User user = profile.getUser();

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepo.save(user);

        // Barcha qurilmalardan chiqarish
        refreshTokenService.revokeAllByUser(user);

        log.info("Tuman paroli o'zgartirildi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "regionId", id,
                "message",  "Parol muvaffaqiyatli o'zgartirildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.9 POST /api/v1/admin/regions/assignOrganization
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> assignOrganization(Integer regionId, Integer organizationId) {
        // Tuman topish (faol bo'lishi shart)
        userRepo.findByNumber(regionId)
                .flatMap(userProfileRepo::findByUser)
                .filter(p -> !p.isDeleted() && p.isActive())
                .orElseThrow(() -> new RegionNotFoundException(
                        "A0015", "Tuman topilmadi yoki faol emas"));

        // Tashkilot topish
        UserProfile orgProfile = userRepo.findByNumber(organizationId)
                .flatMap(userProfileRepo::findByUser)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new OrganizationNotFoundException(
                        "A0014", "Tashkilot topilmadi"));

        orgProfile.setRegionId(regionId);
        userProfileRepo.save(orgProfile);

        log.info("Tashkilot {} tumanga {} biriktirildi", organizationId, regionId);
        return ResponseEntity.ok(Map.of("message", "Tashkilot muvaffaqiyatli tumanga biriktirildi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.10 DELETE /api/v1/admin/regions/removeOrganization
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> removeOrganization(Integer regionId, Integer organizationId) {
        UserProfile orgProfile = userRepo.findByNumber(organizationId)
                .flatMap(userProfileRepo::findByUser)
                .filter(p -> !p.isDeleted() && regionId.equals(p.getRegionId()))
                .orElseThrow(() -> new OrganizationNotFoundException(
                        "A0017", "Tashkilot topilmadi yoki bu tumanga biriktirilmagan"));

        orgProfile.setRegionId(0);
        userProfileRepo.save(orgProfile);

        log.info("Tashkilot {} tumandan {} olib tashlandi", organizationId, regionId);
        return ResponseEntity.ok(Map.of("message", "Tashkilot tumanadan muvaffaqiyatli olib tashlandi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.11 GET /api/v1/admin/regions/getUnassignedOrganizations
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getUnassignedOrganizations() {
        List<UserProfile> orgs = userProfileRepo.findUnassignedOrganizationsByRegion(UserRoles.ROLE_ADMIN);

        List<Map<String, Object>> data = orgs.stream()
                .map(this::toOrgItem)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("data", data, "total", data.size()));
    }

    // ═══════════════════════════════════════════════════════════
    //  7.12 GET /api/v1/admin/regions/getRegionOrganizations
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getRegionOrganizations(Integer regionId) {
        List<UserProfile> orgs = userProfileRepo.findOrganizationsByRegionId(
                UserRoles.ROLE_ADMIN, regionId);

        List<Map<String, Object>> data = orgs.stream()
                .map(this::toOrgItem)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("data", data, "total", data.size()));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers
    // ═══════════════════════════════════════════════════════════

    private UserProfile findRegionProfileByNumber(Integer number, String errorCode) {
        User user = userRepo.findByNumber(number)
                .orElseThrow(() -> new RegionNotFoundException(errorCode, "Tuman topilmadi"));
        return userProfileRepo.findByUser(user)
                .orElseThrow(() -> new RegionNotFoundException(errorCode, "Tuman topilmadi"));
    }

    private RegionListItem toListItem(UserProfile p) {
        return RegionListItem.builder()
                .id(p.getUser().getNumber())
                .name(p.getUser().getName())
                .login(p.getUser().getPhone())
                .directorName(p.getDirectorName())
                .phoneNumber(p.getPhoneNumber())
                .provinceId(p.getProvinceId())
                .provinceName(p.getProvinceName())
                .active(p.isActive())
                .createdTime(p.getUser().getCreated_at())
                .lastLogin(p.getLastLogin())
                .build();
    }

    private RegionDetailResponse toDetailResponse(UserProfile p) {
        User u = p.getUser();
        Role role = (u.getActiveRole() != null) ? u.getActiveRole()
                : (u.getRoles() != null && !u.getRoles().isEmpty()) ? u.getRoles().get(0) : null;

        return RegionDetailResponse.builder()
                .id(u.getNumber())
                .name(u.getName())
                .login(u.getPhone())
                .directorName(p.getDirectorName())
                .phoneNumber(p.getPhoneNumber())
                .provinceId(p.getProvinceId())
                .provinceName(p.getProvinceName())
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

    private Map<String, Object> toOrgItem(UserProfile p) {
        return Map.of(
                "id",             p.getUser().getNumber() != null ? p.getUser().getNumber() : 0,
                "name",           p.getUser().getName() != null ? p.getUser().getName() : "",
                "directorName",   p.getDirectorName() != null ? p.getDirectorName() : "",
                "phoneNumber",    p.getPhoneNumber() != null ? p.getPhoneNumber() : "",
                "businessSphere", p.getBusinessSphere() != null ? p.getBusinessSphere() : "",
                "active",         p.isActive(),
                "createdTime",    p.getUser().getCreated_at() != null
                                    ? p.getUser().getCreated_at().toString() : ""
        );
    }
}

