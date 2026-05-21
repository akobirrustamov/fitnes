package com.example.backend.Controller;

import com.example.backend.Payload.req.*;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.TrainerService.TrainerService;
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
@RequestMapping("/api/v1/organizations/trainers")
@Slf4j
public class TrainersController {

    private final TrainerService trainerService;
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
            log.warn("Trainer token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.getAll(orgId);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.getById(orgId, id);
    }

    @PostMapping("/create")
    public HttpEntity<?> create(HttpServletRequest request, @RequestBody TrainerCreateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.create(orgId, body);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(HttpServletRequest request,
                                @RequestParam Long id,
                                @RequestBody TrainerUpdateRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.update(orgId, id, body);
    }

    @DeleteMapping("/delete")
    public HttpEntity<?> delete(HttpServletRequest request, @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.delete(orgId, id);
    }

    @PostMapping("/addStudent")
    public HttpEntity<?> addStudent(HttpServletRequest request,
                                    @RequestParam Long trainerId,
                                    @RequestBody TrainerAddStudentRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.addStudent(orgId, trainerId, body);
    }

    @DeleteMapping("/removeStudent")
    public HttpEntity<?> removeStudent(HttpServletRequest request,
                                       @RequestParam Long trainerId,
                                       @RequestParam Long personId) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.removeStudent(orgId, trainerId, personId);
    }

    @PostMapping("/extendStudentSubscription")
    public HttpEntity<?> extendStudentSubscription(HttpServletRequest request,
                                                   @RequestParam Long trainerId,
                                                   @RequestBody TrainerExtendStudentSubscriptionRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return trainerService.extendStudentSubscription(orgId, trainerId, body);
    }
}

