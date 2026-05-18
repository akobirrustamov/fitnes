package com.example.backend.Controller;

import com.example.backend.Payload.req.NewsCreateRequest;
import com.example.backend.Payload.req.NewsUpdateRequest;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.NewsService.NewsService;
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
@RequestMapping("/api/v1/organizations/news")
@Slf4j
public class NewsController {

    private final NewsService newsService;
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
            log.warn("News token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @PostMapping("/create")
    public HttpEntity<?> create(
            @RequestBody NewsCreateRequest request
    ) {
        return newsService.create(request);
    }

    @PutMapping("/update")
    public HttpEntity<?> update(
            @RequestParam Long newsId,
            @RequestBody NewsUpdateRequest request
    ) {
        return newsService.update(newsId, request);
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "20") int pageSize,
                                @RequestParam(required = false) Boolean isRead) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return newsService.getAll(orgId, page, pageSize, isRead);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request,
                                 @RequestParam Long newsId) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return newsService.getById(orgId, newsId);
    }

    @PostMapping("/markAsRead")
    public HttpEntity<?> markAsRead(HttpServletRequest request,
                                    @RequestParam Long newsId) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return newsService.markAsRead(orgId, newsId);
    }

    @PostMapping("/markAllAsRead")
    public HttpEntity<?> markAllAsRead(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return newsService.markAllAsRead(orgId);
    }

    @GetMapping("/getUnreadCount")
    public HttpEntity<?> getUnreadCount(HttpServletRequest request) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return newsService.getUnreadCount(orgId);
    }
}

