package com.example.backend.Payload.req;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MarketProductUpdateRequest {
    private Integer categoryId;
    private String name;
    private String description;
    private String photoUrl;
    private BigDecimal price;
    private Integer stockCount;
    private Boolean active;
    private String barcode;
}

