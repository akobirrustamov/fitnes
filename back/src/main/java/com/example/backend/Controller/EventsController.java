package com.example.backend.Controller;

import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.EventsService.EventsService;
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
@RequestMapping("/api/v1/organizations/events")
@Slf4j
public class EventsController {

    private final EventsService eventsService;
    private final JwtService jwtService;
    private final UserRepo userRepo;

    private Integer resolveOrgId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try {
            String subject = jwtService.extractSubjectFromJwt(token);
            java.util.UUID userId = java.util.UUID.fromString(subject);
            return userRepo.findById(userId)
                    .map(com.example.backend.Entity.User::getNumber)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Events token xatosi: {}", e.getMessage());
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
                                @RequestParam(required = false) Long terminalId,
                                @RequestParam(required = false) String eventType,
                                @RequestParam(required = false) String startDate,
                                @RequestParam(required = false) String endDate,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "50") int limit) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return eventsService.getAll(orgId, personId, terminalId, eventType, startDate, endDate, page, limit);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request,
                                 @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return eventsService.getById(orgId, id);
    }

    @GetMapping("/getLastByPerson")
    public HttpEntity<?> getLastByPerson(HttpServletRequest request,
                                         @RequestParam Long personId) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return eventsService.getLastByPerson(orgId, personId);
    }

    @GetMapping("/getToday")
    public HttpEntity<?> getToday(HttpServletRequest request,
                                  @RequestParam(required = false) Long terminalId,
                                  @RequestParam(required = false) String eventType,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "50") int limit) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return eventsService.getToday(orgId, terminalId, eventType, page, limit);
    }

    @GetMapping("/downloadExcel")
    public HttpEntity<?> downloadExcel(HttpServletRequest request,
                                       @RequestParam(required = false) Long personId,
                                       @RequestParam(required = false) Long terminalId,
                                       @RequestParam(required = false) String eventType,
                                       @RequestParam(required = false) String startDate,
                                       @RequestParam(required = false) String endDate) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return eventsService.downloadExcel(orgId, personId, terminalId, eventType, startDate, endDate);
    }
}

