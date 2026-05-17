package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TrainerCreateRequest {
    private String fullname;
    private String photoUrl;
    private String achievements;
    private BigDecimal price;
    private String phoneNumber;
    private String specialization;
    private Integer experienceYears;
    private String bio;
    private Boolean active;
}

