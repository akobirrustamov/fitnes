package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentCreateRequest {
    private Long personId;
    private String category;
    private String description;
    private BigDecimal price;
    private String paymentType;
}

