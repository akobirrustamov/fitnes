package com.example.backend.Services.MonitorService;

import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Payload.req.MonitorChangePasswordRequest;
import com.example.backend.Payload.req.MonitorCreateRequest;
import com.example.backend.Payload.req.MonitorUpdateRequest;
import com.example.backend.Payload.res.MonitorDetailResponse;
import com.example.backend.Payload.res.MonitorListItem;
import com.example.backend.Repository.MonitorRepo;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.AuthService.RefreshTokenService;
import com.example.backend.exceptions.MonitorNotFoundException;
import com.example.backend.exceptions.OrganizationNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
public class MonitorServiceImpl implements MonitorService {

    private final UserRepo userRepo;
    private final MonitorRepo monitorRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    // ═══════════════════════════════════════════════════════════
    //  6.1 GET /api/v1/admin/monitors/getAll
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getAll(String part, Boolean active, int page, int pageSize) {
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), pageSize);
        String partParam = (part != null && !part.isBlank()) ? part : null;

        Page<UserProfile> resultPage = monitorRepo.findMonitors(
                UserRoles.ROLE_MONITOR, active, partParam, pageable);

        List<MonitorListItem> items = resultPage.getContent()
                .stream()
                .map(this::toListItem)
                .toList();

        return ResponseEntity.ok(Map.of(
                "data",       items,
                "totalCount", resultPage.getTotalElements(),
                "page",       page,
                "pageSize",   pageSize
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.2 GET /api/v1/admin/monitors/download
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> download(String part, Boolean active) {
        String partParam = (part != null && !part.isBlank()) ? part : null;
        List<UserProfile> monitors = monitorRepo.findMonitorsAll(
                UserRoles.ROLE_MONITOR, active, partParam);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Monitors");

            // Header
            Row header = sheet.createRow(0);
            String[] cols = {"ID", "Name", "Login", "Phone Number", "Description", "Active", "Created Time", "Last Login"};
            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            // Rows
            int rowIdx = 1;
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (UserProfile up : monitors) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(up.getUser().getNumber() != null ? up.getUser().getNumber() : 0);
                row.createCell(1).setCellValue(up.getUser().getName() != null ? up.getUser().getName() : "");
                row.createCell(2).setCellValue(up.getUser().getPhone() != null ? up.getUser().getPhone() : "");
                row.createCell(3).setCellValue(up.getPhoneNumber() != null ? up.getPhoneNumber() : "");
                row.createCell(4).setCellValue(up.getDescription() != null ? up.getDescription() : "");
                row.createCell(5).setCellValue(up.isActive() ? "Ha" : "Yo'q");
                row.createCell(6).setCellValue(up.getUser().getCreated_at() != null ? up.getUser().getCreated_at().format(fmt) : "");
                row.createCell(7).setCellValue(up.getLastLogin() != null ? up.getLastLogin().format(fmt) : "");
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] bytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("monitors_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx")
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
    //  6.3 GET /api/v1/admin/monitors/getById/{id}
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getById(Integer id) {
        UserProfile profile = findMonitorProfileByNumber(id);
        return ResponseEntity.ok(toDetailResponse(profile));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.4 POST /api/v1/admin/monitors/add
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> add(MonitorCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0020", "message", "Name maydoni bo'sh bo'lishi mumkin emas"));
        }
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0020", "message", "Login maydoni bo'sh bo'lishi mumkin emas"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "A0020", "message", "Password maydoni bo'sh bo'lishi mumkin emas"));
        }

        // Login unikalligi
        if (userRepo.findByPhone(request.getLogin()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "A0019", "message", "Bunday login allaqachon mavjud"));
        }

        int nextNumber = userRepo.findMaxNumber().orElse(0) + 1;
        Role monitorRole = roleRepo.findByName(UserRoles.ROLE_MONITOR);

        User user = User.builder()
                .phone(request.getLogin())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .number(nextNumber)
                .roles(List.of(monitorRole))
                .created_at(LocalDateTime.now())
                .build();
        userRepo.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .phoneNumber(request.getPhoneNumber())
                .description(request.getDescription())
                .passwordHint(request.getPasswordHint())
                .active(true)
                .deleted(false)
                .telegramBotActive(false)
                .build();
        monitorRepo.save(profile);

        log.info("Monitor yaratildi: id={}, login={}", nextNumber, request.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "monitorId", nextNumber,
                "message",   "Monitor muvaffaqiyatli yaratildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.5 PUT /api/v1/admin/monitors/update?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> update(Integer id, MonitorUpdateRequest request) {
        UserProfile profile = findMonitorProfileByNumber(id);
        User user = profile.getUser();

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
            userRepo.save(user);
        }
        if (request.getDescription() != null) profile.setDescription(request.getDescription());
        if (request.getPhoneNumber()  != null) profile.setPhoneNumber(request.getPhoneNumber());
        if (request.getPhotoUrl()     != null) profile.setPhotoUrl(request.getPhotoUrl());

        profile.setUpdatedAt(LocalDateTime.now());
        monitorRepo.save(profile);

        log.info("Monitor yangilandi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "monitorId", id,
                "message",   "Monitor muvaffaqiyatli yangilandi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.6 DELETE /api/v1/admin/monitors/delete?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> delete(Integer id) {
        UserProfile profile = findMonitorProfileByNumber(id);

        profile.setDeleted(true);
        profile.setActive(false);
        monitorRepo.save(profile);

        log.info("Monitor soft-deleted: id={}", id);
        return ResponseEntity.ok(Map.of("message", "Monitor muvaffaqiyatli o'chirildi"));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.7 POST /api/v1/admin/monitors/setActive/{id}?active=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> setActive(Integer id, Boolean active) {
        UserProfile profile = findMonitorProfileByNumber(id);
        profile.setActive(active);
        monitorRepo.save(profile);

        String msg = active ? "Monitor faollashtirildi" : "Monitor bloklandi";
        log.info("{}: id={}", msg, id);
        return ResponseEntity.ok(Map.of(
                "monitorId", id,
                "active",    active,
                "message",   msg
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.8 POST /api/v1/admin/monitors/changePassword/{id}
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> changePassword(Integer id, MonitorChangePasswordRequest request) {
        UserProfile profile = findMonitorProfileByNumber(id);
        User user = profile.getUser();

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepo.save(user);

        // Barcha qurilmalardan chiqarish
        refreshTokenService.revokeAllByUser(user);

        log.info("Monitor paroli o'zgartirildi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "monitorId", id,
                "message",   "Parol muvaffaqiyatli o'zgartirildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.9 POST /api/v1/admin/monitors/addOrganization
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> addOrganization(Integer monitorId, Integer organizationId) {
        // Monitor topish (faol bo'lishi shart)
        monitorRepo.findByUser_NumberAndDeletedFalse(monitorId)
                .filter(UserProfile::isActive)
                .orElseThrow(() -> new MonitorNotFoundException(
                        "A0018", "Monitor topilmadi yoki faol emas."));

        // Tashkilot topish
        UserProfile orgProfile = monitorRepo.findByUser_NumberAndDeletedFalse(organizationId)
                .orElseThrow(() -> new OrganizationNotFoundException(
                        "A0023", "Tashkilot topilmadi."));

        orgProfile.setMonitorId(monitorId);
        monitorRepo.save(orgProfile);

        log.info("Tashkilot {} monitorga {} biriktirildi", organizationId, monitorId);
        return ResponseEntity.ok(Map.of("message", "Tashkilot muvaffaqiyatli monitorga biriktirildi."));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.10 DELETE /api/v1/admin/monitors/removeOrganization
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> removeOrganization(Integer monitorId, Integer organizationId) {
        UserProfile orgProfile = monitorRepo.findByUser_NumberAndDeletedFalse(organizationId)
                .filter(p -> monitorId.equals(p.getMonitorId()))
                .orElseThrow(() -> new MonitorNotFoundException(
                        "A0025", "Tashkilot topilmadi yoki bu monitorga biriktirilmagan."));

        orgProfile.setMonitorId(0);
        monitorRepo.save(orgProfile);

        log.info("Tashkilot {} monitordan {} olib tashlandi", organizationId, monitorId);
        return ResponseEntity.ok(Map.of("message", "Tashkilot muvaffaqiyatli monitordan olib tashlandi."));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.11 GET /api/v1/admin/monitors/getOrganizations
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getOrganizations(Integer monitorId) {
        List<UserProfile> orgs = monitorRepo.findOrganizationsByMonitorId(
                UserRoles.ROLE_ADMIN, monitorId);

        List<Map<String, Object>> data = orgs.stream()
                .map(this::toOrgItem)
                .toList();

        return ResponseEntity.ok(Map.of("data", data, "total", data.size()));
    }

    // ═══════════════════════════════════════════════════════════
    //  6.12 GET /api/v1/admin/monitors/getUnassignedOrganizations
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getUnassignedOrganizations() {
        List<UserProfile> orgs = monitorRepo.findUnassignedOrganizations(UserRoles.ROLE_ADMIN);

        List<Map<String, Object>> data = orgs.stream()
                .map(this::toOrgItem)
                .toList();

        return ResponseEntity.ok(Map.of("data", data, "total", data.size()));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers
    // ═══════════════════════════════════════════════════════════

    private UserProfile findMonitorProfileByNumber(Integer number) {
        return monitorRepo.findByUser_NumberAndDeletedFalse(number)
                .orElseThrow(() -> new MonitorNotFoundException("A0018", "Monitor topilmadi"));
    }

    private MonitorListItem toListItem(UserProfile p) {
        return MonitorListItem.builder()
                .id(p.getUser().getNumber())
                .name(p.getUser().getName())
                .login(p.getUser().getPhone())
                .phoneNumber(p.getPhoneNumber())
                .description(p.getDescription())
                .photoUrl(p.getPhotoUrl())
                .active(p.isActive())
                .createdTime(p.getUser().getCreated_at())
                .lastLogin(p.getLastLogin())
                .build();
    }

    private MonitorDetailResponse toDetailResponse(UserProfile p) {
        User u = p.getUser();
        Role role = (u.getActiveRole() != null) ? u.getActiveRole()
                : (u.getRoles() != null && !u.getRoles().isEmpty()) ? u.getRoles().get(0) : null;

        return MonitorDetailResponse.builder()
                .id(u.getNumber())
                .name(u.getName())
                .login(u.getPhone())
                .phoneNumber(p.getPhoneNumber())
                .description(p.getDescription())
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
                "createdTime",    p.getUser().getCreated_at() != null ? p.getUser().getCreated_at().toString() : ""
        );
    }
}

