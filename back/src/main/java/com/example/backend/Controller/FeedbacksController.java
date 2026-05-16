package com.example.backend.Controller;

import com.example.backend.Payload.req.FeedbackSendRequest;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.FeedbacksService.FeedbacksService;
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
@RequestMapping("/api/v1/organizations/feedbacks")
@Slf4j
public class FeedbacksController {

    private final FeedbacksService feedbacksService;
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
            log.warn("Feedback token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @PostMapping("/send")
    public HttpEntity<?> send(HttpServletRequest request,
                              @RequestBody FeedbackSendRequest body) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return feedbacksService.send(orgId, body);
    }
}

