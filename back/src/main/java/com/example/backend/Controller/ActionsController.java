package com.example.backend.Controller;

import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.ActionService.ActionService;
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
@RequestMapping("/api/v1/organizations/actions")
@Slf4j
public class ActionsController {

    private final ActionService actionService;
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
            log.warn("Actions token xatosi: {}", e.getMessage());
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
            @RequestParam(required = false) Integer personId
    ) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return actionService.getAll(orgId, personId);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return actionService.getById(orgId, id);
    }

    @PostMapping("/create")
    public HttpEntity<?> create(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return actionService.create(orgId, body);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestBody Map<String, Object> body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return actionService.update(orgId, id, body);
    }

    @DeleteMapping("/delete")
    public HttpEntity<?> delete(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return actionService.delete(orgId, id);
    }
}
