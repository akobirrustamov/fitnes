package com.example.backend.Controller;

import com.example.backend.Payload.req.DateUpdateRequest;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.DatesService.DatesService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/organizations/dates")
@Slf4j
public class DatesController {

    private final DatesService datesService;
    private final JwtService jwtService;
    private final UserRepo userRepo;

    private Integer resolveOrgId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try {
            String phone = jwtService.extractSubjectFromJwt(token);
            return userRepo.findByPhone(phone)
                    .map(com.example.backend.Entity.User::getNumber)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Dates token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request,
                                @RequestParam Integer month,
                                @RequestParam(required = false) Integer year) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        int safeYear = (year == null ? LocalDate.now().getYear() : year);
        return datesService.getAll(orgId, month, safeYear);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestBody DateUpdateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return datesService.update(orgId, id, body);
    }

    @GetMapping("/download")
    public HttpEntity<?> download(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return datesService.download(orgId);
    }

    @GetMapping("/capabilities")
    public HttpEntity<?> capabilities(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return datesService.capabilities(orgId);
    }
}

