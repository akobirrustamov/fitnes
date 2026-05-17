package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MarketSellItemRequest {
    private Long productId;
    private String productName;
    private Integer amount;
    private BigDecimal price;
}

