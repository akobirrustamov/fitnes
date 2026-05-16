package com.example.backend.Services.GuestFeedbackService;

import com.example.backend.Payload.req.GuestFeedbackSendRequest;
import com.example.backend.Payload.req.GuestRegisterRequest;
import org.springframework.http.HttpEntity;

public interface GuestFeedbackService {
    HttpEntity<?> send(GuestFeedbackSendRequest request, String ipAddress);

    HttpEntity<?> register(GuestRegisterRequest request, String ipAddress);
}

