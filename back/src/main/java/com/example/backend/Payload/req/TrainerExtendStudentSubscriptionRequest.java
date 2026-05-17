package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TrainerExtendStudentSubscriptionRequest {
    private Long personId;
    private BigDecimal price;
    private BigDecimal paidAmount;
}

