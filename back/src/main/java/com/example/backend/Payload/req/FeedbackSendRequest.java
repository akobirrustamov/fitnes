package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class FeedbackSendRequest {
    private String title;
    private String description;
    private String email;
    private String phoneNumber;
}

