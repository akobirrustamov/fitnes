package com.example.backend.Services.FeedbacksService;

import com.example.backend.Payload.req.FeedbackSendRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbacksServiceImpl implements FeedbacksService {

    private final JdbcTemplate jdbc;

    @Override
    public HttpEntity<?> send(Integer orgId, FeedbackSendRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "title majburiy"));
        }

        String mergedDescription = request.getDescription();
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            mergedDescription = (mergedDescription == null || mergedDescription.isBlank())
                    ? "Email: " + request.getEmail().trim()
                    : mergedDescription + "\nEmail: " + request.getEmail().trim();
        }

        Integer feedbackId;
        try {
            feedbackId = jdbc.queryForObject(
                    "SELECT add_feedback_from_organization(?, ?, ?, ?)",
                    Integer.class,
                    orgId,
                    request.getTitle(),
                    mergedDescription,
                    false
            );
        } catch (Exception e) {
            // fallback if function not found
            feedbackId = jdbc.queryForObject(
                    "INSERT INTO feedbacks(organization_id, title, description, phone_number, is_registration, is_seen, created_at) " +
                            "VALUES (?, ?, ?, ?, false, false, NOW()) RETURNING id",
                    Integer.class,
                    orgId,
                    request.getTitle(),
                    mergedDescription,
                    request.getPhoneNumber()
            );
        }

        if (feedbackId == null || feedbackId < 1) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Feedback yuborilmadi"));
        }

        return ResponseEntity.ok(Map.of(
                "feedbackId", feedbackId,
                "message", "Feedback muvaffaqiyatli yuborildi"
        ));
    }
}
