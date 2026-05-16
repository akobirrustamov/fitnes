package com.example.backend.Controller;

import com.example.backend.Payload.req.TerminalAddRequest;
import com.example.backend.Payload.req.TerminalUpdateRequest;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.TerminalService.TerminalService;
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
@RequestMapping("/api/v1/organizations/terminals")
@Slf4j
public class TerminalsController {

    private final TerminalService terminalService;
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
            log.warn("Terminal token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request,
                                @RequestParam(required = false) String part,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "10") int pageSize) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.getAll(orgId, part, page, pageSize);
    }

    @GetMapping("/getById/{id}")
    public HttpEntity<?> getById(HttpServletRequest request, @PathVariable Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.getById(orgId, id);
    }

    @GetMapping("/download")
    public HttpEntity<?> download(HttpServletRequest request,
                                  @RequestParam(required = false) String part) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.download(orgId, part);
    }

    @PostMapping("/add")
    public HttpEntity<?> add(HttpServletRequest request, @RequestBody TerminalAddRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.add(orgId, body);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestBody TerminalUpdateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.update(orgId, id, body);
    }

    @DeleteMapping("/delete")
    public HttpEntity<?> delete(HttpServletRequest request,
                                @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.delete(orgId, id);
    }

    @PostMapping("/reset/{id}")
    public HttpEntity<?> reset(HttpServletRequest request,
                               @PathVariable Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return terminalService.reset(orgId, id);
    }
}

