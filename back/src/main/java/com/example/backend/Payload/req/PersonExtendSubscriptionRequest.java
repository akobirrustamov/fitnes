package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PersonExtendSubscriptionRequest {
    private LocalDate endDate;
    private Integer accessCount;
    private BigDecimal price;
    private BigDecimal paidAmount;
}

