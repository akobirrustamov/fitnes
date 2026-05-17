package com.example.backend.Services.FeedbacksService;

import com.example.backend.Payload.req.FeedbackSendRequest;
import org.springframework.http.HttpEntity;

public interface FeedbacksService {
    HttpEntity<?> send(Integer orgId, FeedbackSendRequest request);
}

