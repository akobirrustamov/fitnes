package com.example.backend.Controller;

import com.example.backend.Payload.req.PaymentCreateRequest;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.PaymentsService.PaymentsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/organizations/payments")
@Slf4j
public class PaymentsController {

    private final PaymentsService paymentsService;
    private final JwtService jwtService;
    private final UserRepo userRepo;

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
            log.warn("Payments token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request,
                                @RequestParam(required = false) Long personId,
                                @RequestParam(required = false) String category,
                                @RequestParam(required = false) String paymentType,
                                @RequestParam(required = false) Boolean isImportant,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "50") int limit) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.getAll(orgId, personId, category, paymentType, isImportant, page, limit);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.getById(orgId, id);
    }

    @PostMapping("/create")
    public HttpEntity<?> create(HttpServletRequest request, @RequestBody PaymentCreateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.create(orgId, body);
    }

    @DeleteMapping("/delete")
    public HttpEntity<?> delete(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.delete(orgId, id);
    }

    @PostMapping("/settlePaymentsByPerson")
    public HttpEntity<?> settlePaymentsByPerson(HttpServletRequest request,
                                                @RequestParam Long personId) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.settlePaymentsByPerson(orgId, personId);
    }

    @PostMapping("/settlePayment")
    public HttpEntity<?> settlePayment(HttpServletRequest request,
                                       @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.settlePayment(orgId, id);
    }

    @GetMapping("/downloadExcel")
    public HttpEntity<?> downloadExcel(HttpServletRequest request,
                                       @RequestParam(required = false) Long personId,
                                       @RequestParam(required = false) String category,
                                       @RequestParam(required = false) String paymentType,
                                       @RequestParam(required = false) Boolean isImportant) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return paymentsService.downloadExcel(orgId, personId, category, paymentType, isImportant);
    }
}

