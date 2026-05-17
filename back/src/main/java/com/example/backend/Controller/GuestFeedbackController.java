package com.example.backend.Controller;

import com.example.backend.Payload.req.GuestFeedbackSendRequest;
import com.example.backend.Payload.req.GuestRegisterRequest;
import com.example.backend.Services.GuestFeedbackService.GuestFeedbackService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/guest/feedbacks")
public class GuestFeedbackController {

    private final GuestFeedbackService guestFeedbackService;

    @PostMapping("/send")
    public HttpEntity<?> send(@RequestBody GuestFeedbackSendRequest body,
                              HttpServletRequest request) {
        return guestFeedbackService.send(body, extractIp(request));
    }

    @PostMapping("/register")
    public HttpEntity<?> register(@RequestBody GuestRegisterRequest body,
                                  HttpServletRequest request) {
        return guestFeedbackService.register(body, extractIp(request));
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

