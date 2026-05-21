package com.example.backend.Controller;

import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.SettingsService.SettingsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/admin/settings")
@Slf4j
public class SettingsController {

    private final SettingsService settingsService;
    private final JwtService jwtService;
    private final UserRepo userRepo;

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/admin/settings/getByOrgId?orgId=
    //  Auth: [super_admin] — by query param
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getByOrgId")
    public HttpEntity<?> getByOrgId(@RequestParam Integer orgId) {
        return settingsService.getByOrgId(orgId);
    }

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/admin/settings/getMine
    //  Auth: [director] — orgId resolved from JWT
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getMine")
    public HttpEntity<?> getMine(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return ResponseEntity.status(401).build();
        return settingsService.getByOrgId(orgId);
    }

    // ────────────────────────────────────────────────────────────
    //  PUT /api/v1/admin/settings/update?orgId=
    //  Auth: [super_admin] — can edit all fields
    // ────────────────────────────────────────────────────────────
    @PutMapping("/update")
    public HttpEntity<?> update(@RequestParam Integer orgId,
                                @RequestBody Map<String, Object> body) {
        return settingsService.update(orgId, body, true);
    }

    // ────────────────────────────────────────────────────────────
    //  PUT /api/v1/admin/settings/updateMine
    //  Auth: [director] — can only edit opening_time, closing_time, price_per_user
    // ────────────────────────────────────────────────────────────
    @PutMapping("/updateMine")
    public HttpEntity<?> updateMine(HttpServletRequest request,
                                    @RequestBody Map<String, Object> body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return ResponseEntity.status(401).build();
        return settingsService.update(orgId, body, false);
    }

    private Integer resolveOrgId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try {
            String userId = jwtService.extractSubjectFromJwt(token);
            return userRepo.findById(UUID.fromString(userId))
                    .map(com.example.backend.Entity.User::getNumber)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Settings token xatosi: {}", e.getMessage());
            return null;
        }
    }
}
