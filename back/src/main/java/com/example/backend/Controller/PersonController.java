package com.example.backend.Controller;

import com.example.backend.Payload.req.*;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.PersonService.PersonService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/organizations/person")
@Slf4j
public class PersonController {

    private final PersonService personService;
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
            log.warn("Person token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(
            HttpServletRequest request,
            @RequestParam(defaultValue = "true") Boolean isClient,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean isExpired,
            @RequestParam(required = false) Boolean hasAccessCount,
            @RequestParam(required = false) Integer trainerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit
    ) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.getAll(orgId, isClient, active, isExpired, hasAccessCount, trainerId, search, page, limit);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.getById(orgId, id);
    }

    @PostMapping("/create")
    public HttpEntity<?> create(HttpServletRequest request, @RequestBody PersonCreateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.create(orgId, body);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestBody PersonUpdateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.update(orgId, id, body);
    }

    @DeleteMapping("/delete")
    public HttpEntity<?> delete(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.delete(orgId, id);
    }

    @PutMapping("/updatePhoto")
    public HttpEntity<?> updatePhoto(HttpServletRequest request,
                                     @RequestParam Long id,
                                     @RequestBody PersonPhotoUpdateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.updatePhoto(orgId, id, body);
    }

    @PostMapping("/extendSubscription")
    public HttpEntity<?> extendSubscription(HttpServletRequest request,
                                            @RequestParam Long id,
                                            @RequestBody PersonExtendSubscriptionRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.extendSubscription(orgId, id, body);
    }

    @PostMapping("/payDebt")
    public HttpEntity<?> payDebt(HttpServletRequest request,
                                 @RequestParam Long id,
                                 @RequestBody PersonDebtPayRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.payDebt(orgId, id, body);
    }

    @PostMapping("/clearAllDebts")
    public HttpEntity<?> clearAllDebts(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.clearAllDebts(orgId, id);
    }

    @PostMapping("/assignTrainer")
    public HttpEntity<?> assignTrainer(HttpServletRequest request,
                                       @RequestParam Long id,
                                       @RequestBody PersonAssignTrainerRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.assignTrainer(orgId, id, body);
    }

    @PostMapping("/refreshInFaceID")
    public HttpEntity<?> refreshInFaceID(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.refreshInFaceID(orgId, id);
    }

    @GetMapping("/downloadExcel")
    public HttpEntity<?> downloadExcel(HttpServletRequest request,
                                       @RequestParam(defaultValue = "true") Boolean isClient) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return personService.downloadExcel(orgId, isClient);
    }
}

