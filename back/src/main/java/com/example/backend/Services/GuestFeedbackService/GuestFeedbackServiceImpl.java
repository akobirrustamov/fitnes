package com.example.backend.Services.GuestFeedbackService;

import com.example.backend.Entity.Feedback;
import com.example.backend.Payload.req.GuestFeedbackSendRequest;
import com.example.backend.Payload.req.GuestRegisterRequest;
import com.example.backend.Repository.FeedbackRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GuestFeedbackServiceImpl implements GuestFeedbackService {

    private final FeedbackRepo feedbackRepo;

    @Override
    public HttpEntity<?> send(GuestFeedbackSendRequest request, String ipAddress) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "title majburiy"));
        }

        String phone = normalizePhone(request.getPhoneNumber());
        String mergedDescription = mergeDescription(
                request.getDescription(),
                request.getEmail(),
                ipAddress,
                null
        );

        Feedback savedFeedback = feedbackRepo.save(Feedback.builder()
                .organizationId(null)
                .title(request.getTitle())
                .description(mergedDescription)
                .fullname(request.getSenderName())
                .phoneNumber(phone)
                .isRegistration(false)
                .isSeen(false)
                .markup(0)
                .createdAt(LocalDateTime.now())
                .build());

        Long feedbackId = savedFeedback.getId();
        if (feedbackId == null || feedbackId < 1) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Feedback yuborilmadi"));
        }

        return ResponseEntity.ok(Map.of(
                "feedbackId", feedbackId,
                "message", "Feedback muvaffaqiyatli yuborildi"
        ));
    }

    @Override
    public HttpEntity<?> register(GuestRegisterRequest request, String ipAddress) {
        if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "companyName majburiy"));
        }
        if (request.getSenderName() == null || request.getSenderName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "senderName majburiy"));
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "phoneNumber majburiy"));
        }

        String phone = normalizePhone(request.getPhoneNumber());

        String companyTitle = request.getCompanyName();
        if (request.getInn() != null && !request.getInn().isBlank()) {
            companyTitle = companyTitle + " (INN: " + request.getInn().trim() + ")";
        }

        String mergedRegion = mergeDescription(
                request.getDescription(),
                request.getEmail(),
                ipAddress,
                "Register request"
        );

        Feedback savedRegistration = feedbackRepo.save(Feedback.builder()
                .organizationId(null)
                .title(companyTitle)
                .description(mergedRegion)
                .fullname(request.getSenderName())
                .phoneNumber(phone)
                .isRegistration(true)
                .isSeen(false)
                .markup(0)
                .createdAt(LocalDateTime.now())
                .build());

        Long registrationId = savedRegistration.getId();
        if (registrationId == null || registrationId < 1) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Registratsiya so'rovi yuborilmadi"));
        }

        return ResponseEntity.ok(Map.of(
                "registrationId", registrationId,
                "message", "Registratsiya so'rovi muvaffaqiyatli yuborildi. Tez orada siz bilan bog'lanamiz."
        ));
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String p = phone.trim().replaceAll("\\s+", "");
        if (p.startsWith("+")) return p;
        if (p.startsWith("998")) return "+" + p;
        if (p.startsWith("0")) return "+998" + p.substring(1);
        return p;
    }

    private String mergeDescription(String description,
                                    String email,
                                    String ip,
                                    String prefix) {
        StringBuilder sb = new StringBuilder();
        if (prefix != null && !prefix.isBlank()) sb.append(prefix.trim());
        if (description != null && !description.isBlank()) {
            if (!sb.isEmpty()) sb.append("\n");
            sb.append(description.trim());
        }
        if (email != null && !email.isBlank()) {
            if (!sb.isEmpty()) sb.append("\n");
            sb.append("Email: ").append(email.trim());
        }
        if (ip != null && !ip.isBlank()) {
            if (!sb.isEmpty()) sb.append("\n");
            sb.append("IP: ").append(ip.trim());
        }
        return sb.toString();
    }
}
