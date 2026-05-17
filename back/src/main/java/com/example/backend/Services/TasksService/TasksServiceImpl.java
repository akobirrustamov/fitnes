package com.example.backend.Services.TasksService;

import com.example.backend.Projection.TaskRowProjection;
import com.example.backend.Repository.TerminalRepo;
import com.example.backend.Repository.TaskRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TasksServiceImpl implements TasksService {

    private final TaskRepo taskRepo;
    private final TerminalRepo terminalRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId, Long terminalId, String waiting, String taskType, int page, int pageSize) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.min(500, Math.max(1, pageSize));

        if (terminalId != null && terminalRepo.findByIdAndOrganizationIdAndDeletedFalse(terminalId, orgId).isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "data", List.of(),
                    "totalCount", 0,
                    "page", safePage,
                    "pageSize", safePageSize
            ));
        }

        Page<TaskRowProjection> resultPage = taskRepo.findFiltered(
                orgId,
                terminalId,
                mapWaitingToDb(waiting),
                mapTaskTypeToDb(taskType),
                PageRequest.of(safePage - 1, safePageSize));

        List<Map<String, Object>> data = resultPage.getContent().stream()
                .map(this::toTaskItem)
                .toList();

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", resultPage.getTotalElements(),
                "page", safePage,
                "pageSize", safePageSize
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        TaskRowProjection task = taskRepo.findDetail(orgId, id).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Task topilmadi"));
        }
        return ResponseEntity.ok(toTaskItem(task));
    }

    @Override
    public HttpEntity<?> getByPerson(Integer orgId, Long personId) {
        List<Map<String, Object>> rows = taskRepo.findByPerson(orgId, personId).stream()
                .map(this::toTaskItem)
                .toList();

        return ResponseEntity.ok(rows);
    }

    private String mapWaitingToDb(String waiting) {
        if (waiting == null || waiting.isBlank()) return null;
        String val = waiting.trim().toLowerCase();
        return switch (val) {
            case "pending" -> "PENDING";
            case "success" -> "DONE";
            case "error" -> "FAILED";
            default -> null;
        };
    }

    private String mapDbStatusToApi(String status) {
        if (status == null) return null;
        return switch (status.toUpperCase()) {
            case "PENDING" -> "pending";
            case "DONE" -> "success";
            case "FAILED" -> "error";
            default -> status.toLowerCase();
        };
    }

    private String mapTaskTypeToDb(String taskType) {
        if (taskType == null || taskType.isBlank()) return null;
        String val = taskType.trim().toLowerCase();
        return switch (val) {
            case "add" -> "add";
            case "update" -> "update";
            case "delete" -> "delete";
            case "photo-update" -> "photo";
            case "clear-data" -> "add_all_persons";
            default -> null;
        };
    }

    private String mapDbTaskTypeToApi(String action) {
        if (action == null) return null;
        return switch (action.toLowerCase()) {
            case "photo" -> "photo-update";
            case "add_all_persons" -> "clear-data";
            default -> action.toLowerCase();
        };
    }

    private Map<String, Object> toTaskItem(TaskRowProjection task) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", task.getId());
        row.put("terminalId", task.getTerminalId());
        row.put("terminalName", task.getTerminalName());
        row.put("personId", task.getPersonId());
        row.put("personName", task.getPersonName());
        row.put("taskType", mapDbTaskTypeToApi(task.getAction()));
        row.put("waiting", mapDbStatusToApi(task.getStatus()));
        row.put("createdTime", task.getCreatedTime() == null ? null : task.getCreatedTime().toString());
        return row;
    }
}

