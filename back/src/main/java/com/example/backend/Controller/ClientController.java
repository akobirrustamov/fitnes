package com.example.backend.Controller;

import com.example.backend.Entity.Person;
import com.example.backend.Entity.Trainer;
import com.example.backend.Repository.EventEntryRepo;
import com.example.backend.Repository.PersonRepo;
import com.example.backend.Repository.TrainerRepo;
import com.example.backend.Security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/client")
@Slf4j
public class ClientController {

    private static final String CLIENT_PREFIX = "CLIENT:";

    private final PersonRepo personRepo;
    private final TrainerRepo trainerRepo;
    private final EventEntryRepo eventEntryRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // ─── helpers ────────────────────────────────────────────────────────────

    private Long resolvePersonId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try {
            String subject = jwtService.extractSubjectFromJwt(token);
            if (subject != null && subject.startsWith(CLIENT_PREFIX)) {
                return Long.parseLong(subject.substring(CLIENT_PREFIX.length()));
            }
        } catch (Exception e) {
            log.warn("Client JWT parse error: {}", e.getMessage());
        }
        return null;
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Avtorizatsiya talab qilinadi"));
    }

    // ─── AUTH ───────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/client/auth/login
     * Body: { "phoneNumber": "...", "password": "..." }
     */
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String phone = body.get("phoneNumber");
        String rawPassword = body.get("password");

        if (phone == null || rawPassword == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Telefon va parol talab qilinadi"));
        }

        Optional<Person> opt = personRepo.findByPhoneNumberAndDeletedFalse(phone.trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Telefon yoki parol xato"));
        }

        Person person = opt.get();

        if (person.getPassword() == null || !passwordEncoder.matches(rawPassword, person.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Telefon yoki parol xato"));
        }

        if (!person.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Hisobingiz faol emas. Administrator bilan bog'laning."));
        }

        String token = jwtService.generateTokenForSubject(CLIENT_PREFIX + person.getId());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("accessToken", token);
        resp.put("personId", person.getId());
        resp.put("fullName", person.getFullName());
        resp.put("photoUrl", person.getPhotoUrl());
        resp.put("organizationId", person.getOrganizationId());
        return ResponseEntity.ok(resp);
    }

    // ─── SELF-SERVICE ────────────────────────────────────────────────────────

    /** GET /api/v1/client/me */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(HttpServletRequest request) {
        Long personId = resolvePersonId(request);
        if (personId == null) return unauthorized();

        Optional<Person> opt = personRepo.findById(personId);
        if (opt.isEmpty() || opt.get().isDeleted()) return ResponseEntity.notFound().build();

        Person p = opt.get();
        Map<String, Object> data = buildPersonMap(p);
        return ResponseEntity.ok(Map.of("data", data));
    }

    /** GET /api/v1/client/visits?page=1&limit=20 */
    @GetMapping("/visits")
    public ResponseEntity<?> getVisits(HttpServletRequest request,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "20") int limit) {
        Long personId = resolvePersonId(request);
        if (personId == null) return unauthorized();

        Optional<Person> opt = personRepo.findById(personId);
        if (opt.isEmpty()) return unauthorized();
        Person p = opt.get();

        int safePage = Math.max(page - 1, 0);
        int safeLimit = Math.min(Math.max(limit, 1), 100);

        var pageResult = eventEntryRepo.findFiltered(
                p.getOrganizationId(), personId, null, null, null, null,
                PageRequest.of(safePage, safeLimit, Sort.by(Sort.Direction.DESC, "entryTime")));

        List<Map<String, Object>> items = pageResult.getContent().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("direction", e.getDirection());
            m.put("terminalName", e.getTerminalName());
            m.put("datetime", e.getDatetime());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "data", items,
                "totalCount", pageResult.getTotalElements(),
                "totalPages", pageResult.getTotalPages(),
                "page", page
        ));
    }

    /** GET /api/v1/client/trainer */
    @GetMapping("/trainer")
    public ResponseEntity<?> getTrainer(HttpServletRequest request) {
        Long personId = resolvePersonId(request);
        if (personId == null) return unauthorized();

        Optional<Person> pOpt = personRepo.findById(personId);
        if (pOpt.isEmpty()) return unauthorized();

        Long trainerId = pOpt.get().getTrainerId();
        if (trainerId == null) return ResponseEntity.ok(Map.of("data", (Object) null));

        Optional<Trainer> tOpt = trainerRepo.findById(trainerId);
        if (tOpt.isEmpty() || tOpt.get().isDeleted()) return ResponseEntity.ok(Map.of("data", (Object) null));

        Trainer t = tOpt.get();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", t.getId());
        data.put("fullname", t.getFullname());
        data.put("photoUrl", t.getPhotoUrl());
        data.put("specialization", t.getSpecialization());
        data.put("phoneNumber", t.getPhoneNumber());
        data.put("bio", t.getBio());
        data.put("experienceYears", t.getExperienceYears());
        data.put("achievements", t.getAchievements());
        return ResponseEntity.ok(Map.of("data", data));
    }

    /** POST /api/v1/client/changePassword */
    @PostMapping("/changePassword")
    public ResponseEntity<?> changePassword(HttpServletRequest request,
                                            @RequestBody Map<String, String> body) {
        Long personId = resolvePersonId(request);
        if (personId == null) return unauthorized();

        Optional<Person> opt = personRepo.findById(personId);
        if (opt.isEmpty()) return unauthorized();
        Person person = opt.get();

        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.trim().length() < 4) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Yangi parol kamida 4 ta belgi bo'lishi kerak"));
        }

        if (person.getPassword() != null) {
            if (oldPassword == null || !passwordEncoder.matches(oldPassword, person.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Eski parol noto'g'ri"));
            }
        }

        person.setPassword(passwordEncoder.encode(newPassword.trim()));
        personRepo.save(person);
        return ResponseEntity.ok(Map.of("message", "Parol muvaffaqiyatli o'zgartirildi"));
    }

    // ─── internal ────────────────────────────────────────────────────────────

    private Map<String, Object> buildPersonMap(Person p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("fullName", p.getFullName());
        m.put("photoUrl", p.getPhotoUrl());
        m.put("phoneNumber", p.getPhoneNumber());
        m.put("gender", p.getGender());
        m.put("birthDate", p.getBirthDate());
        m.put("location", p.getLocation());
        m.put("active", p.isActive());
        m.put("subscriptionEnd", p.getSubscriptionEnd());
        m.put("accessCount", p.getAccessCount());
        m.put("debt", p.getDebt());
        m.put("trainerId", p.getTrainerId());
        m.put("hasPassword", p.getPassword() != null);
        return m;
    }
}
