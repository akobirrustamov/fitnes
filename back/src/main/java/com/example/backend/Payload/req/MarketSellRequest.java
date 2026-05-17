package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MarketSellRequest {
    private Long personId;
    private List<MarketSellItemRequest> items;
    private BigDecimal paidAmount;
}

