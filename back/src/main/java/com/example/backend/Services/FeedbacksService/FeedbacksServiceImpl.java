package com.example.backend.Services.FeedbacksService;

import com.example.backend.Entity.Feedback;
import com.example.backend.Payload.req.FeedbackSendRequest;
import com.example.backend.Repository.FeedbackRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbacksServiceImpl implements FeedbacksService {

    private final FeedbackRepo feedbackRepo;

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

        Feedback saved = feedbackRepo.save(Feedback.builder()
                .organizationId(orgId)
                .title(request.getTitle())
                .description(mergedDescription)
                .phoneNumber(request.getPhoneNumber())
                .isRegistration(false)
                .isSeen(false)
                .markup(0)
                .createdAt(LocalDateTime.now())
                .build());

        Long feedbackId = saved.getId();
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
