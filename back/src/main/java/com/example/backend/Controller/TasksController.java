package com.example.backend.Controller;

import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.TasksService.TasksService;
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
@RequestMapping("/api/v1/organizations/tasks")
@Slf4j
public class TasksController {

    private final TasksService tasksService;
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
            log.warn("Tasks token xatosi: {}", e.getMessage());
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    @GetMapping("/getAll")
    public HttpEntity<?> getAll(HttpServletRequest request,
                                @RequestParam(required = false) Long terminalId,
                                @RequestParam(required = false) String waiting,
                                @RequestParam(required = false) String taskType,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "10") int pageSize) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return tasksService.getAll(orgId, terminalId, waiting, taskType, page, pageSize);
    }

    @GetMapping("/getById")
    public HttpEntity<?> getById(HttpServletRequest request,
                                 @RequestParam Long id) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return tasksService.getById(orgId, id);
    }

    @GetMapping("/getByPerson")
    public HttpEntity<?> getByPerson(HttpServletRequest request,
                                     @RequestParam Long personId) {
        Integer orgId = resolveOrgId(request);
        if (orgId == null) return unauthorized();
        return tasksService.getByPerson(orgId, personId);
    }
}

