package com.example.backend.Services.ActionService;

import com.example.backend.Entity.Action;
import com.example.backend.Repository.ActionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActionServiceImpl implements ActionService {

    private final ActionRepo actionRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId, Integer personId) {
        List<Action> actions = personId != null
                ? actionRepo.findByOrganizationIdAndPersonIdAndDeletedFalseOrderByIdDesc(orgId, personId)
                : actionRepo.findByOrganizationIdAndDeletedFalseOrderByIdDesc(orgId);

        return ResponseEntity.ok(actions.stream().map(this::toMap).toList());
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        Action action = actionRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (action == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Action topilmadi"));
        }
        return ResponseEntity.ok(toMap(action));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, Map<String, Object> request) {
        Integer personId = (Integer) request.get("personId");
        if (personId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "personId majburiy"));
        }

        LocalDate date = request.get("date") != null
                ? LocalDate.parse(request.get("date").toString())
                : LocalDate.now();

        if (actionRepo.findByDateAndPersonIdAndDeletedFalse(date, personId).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Bu sana uchun action allaqachon mavjud"));
        }

        Action saved = actionRepo.save(Action.builder()
                .organizationId(orgId)
                .personId(personId)
                .incomingTime(parseDateTime(request.get("incomingTime")))
                .outgoingTime(parseDateTime(request.get("outgoingTime")))
                .createdTime(LocalDateTime.now())
                .deleted(false)
                .todayIsImportant(request.get("todayIsImportant") != null
                        ? Boolean.parseBoolean(request.get("todayIsImportant").toString()) : null)
                .date(date)
                .datetime(parseDateTime(request.get("datetime")))
                .sDays(request.get("sDays") != null ? Integer.parseInt(request.get("sDays").toString()) : 0)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "message", "Action muvaffaqiyatli yaratildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, Map<String, Object> request) {
        Action action = actionRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (action == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Action topilmadi"));
        }

        if (request.get("incomingTime") != null) action.setIncomingTime(parseDateTime(request.get("incomingTime")));
        if (request.get("outgoingTime") != null) action.setOutgoingTime(parseDateTime(request.get("outgoingTime")));
        if (request.get("todayIsImportant") != null)
            action.setTodayIsImportant(Boolean.parseBoolean(request.get("todayIsImportant").toString()));
        if (request.get("datetime") != null) action.setDatetime(parseDateTime(request.get("datetime")));
        if (request.get("sDays") != null) action.setSDays(Integer.parseInt(request.get("sDays").toString()));

        actionRepo.save(action);
        return ResponseEntity.ok(Map.of("message", "Action muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        Action action = actionRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (action == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Action topilmadi"));
        }
        action.setDeleted(true);
        actionRepo.save(action);
        return ResponseEntity.ok(Map.of("message", "Action muvaffaqiyatli o'chirildi"));
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null) return null;
        try {
            return LocalDateTime.parse(value.toString());
        } catch (Exception e) {
            log.warn("DateTime parse error: {}", value);
            return null;
        }
    }

    private Map<String, Object> toMap(Action a) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", a.getId());
        row.put("personId", a.getPersonId());
        row.put("organizationId", a.getOrganizationId());
        row.put("incomingTime", a.getIncomingTime() == null ? null : a.getIncomingTime().toString());
        row.put("outgoingTime", a.getOutgoingTime() == null ? null : a.getOutgoingTime().toString());
        row.put("createdTime", a.getCreatedTime() == null ? null : a.getCreatedTime().toString());
        row.put("todayIsImportant", a.getTodayIsImportant());
        row.put("date", a.getDate() == null ? null : a.getDate().toString());
        row.put("datetime", a.getDatetime() == null ? null : a.getDatetime().toString());
        row.put("sDays", a.getSDays());
        return row;
    }
}
