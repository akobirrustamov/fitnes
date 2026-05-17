package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class GuestFeedbackSendRequest {
    private String title;
    private String description;
    private String email;
    private String phoneNumber;
    private String senderName;
}

