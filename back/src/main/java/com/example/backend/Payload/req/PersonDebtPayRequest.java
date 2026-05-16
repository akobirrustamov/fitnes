package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PersonDebtPayRequest {
    private BigDecimal amount;
    private String category;
}

