package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class GuestRegisterRequest {
    private String companyName;
    private String inn;
    private String senderName;
    private String email;
    private String phoneNumber;
    private String description;
}

