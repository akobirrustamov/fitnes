package com.example.backend.Controller;

import com.example.backend.Payload.req.*;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.MarketService.MarketService;
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
@RequestMapping("/api/v1/organizations/market")
@Slf4j
public class MarketController {

    private final MarketService marketService;
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
            log.warn("Market token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request,
                                @RequestParam(required = false) Integer organizationId,
                                @RequestParam(required = false) Integer categoryId,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "50") int limit) {
        Integer orgId = organizationId != null ? organizationId : resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return marketService.getAll(orgId, categoryId, page, limit);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request,
                                 @RequestParam Long id,
                                 @RequestParam(required = false) Integer organizationId) {
        Integer orgId = organizationId != null ? organizationId : resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return marketService.getById(orgId, id);
    }

    @PostMapping("/create")
    public HttpEntity<?> create(HttpServletRequest request,
                                @RequestParam(required = false) Integer organizationId,
                                @RequestBody MarketProductCreateRequest body) {
        Integer orgId = organizationId != null ? organizationId : resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return marketService.create(orgId, body);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestParam(required = false) Integer organizationId,
                                @RequestBody MarketProductUpdateRequest body) {
        Integer orgId = organizationId != null ? organizationId : resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return marketService.update(orgId, id, body);
    }

    @DeleteMapping("/delete")
    public HttpEntity<?> delete(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestParam(required = false) Integer organizationId) {
        Integer orgId = organizationId != null ? organizationId : resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return marketService.delete(orgId, id);
    }

    @GetMapping("/suggestions")
    public HttpEntity<?> suggestions(@RequestParam(required = false) Integer categoryId) {
        return marketService.getSuggestions(categoryId);
    }

    @PostMapping("/sell")
    public HttpEntity<?> sell(HttpServletRequest request, @RequestBody MarketSellRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return marketService.sell(orgId, body);
    }
}

