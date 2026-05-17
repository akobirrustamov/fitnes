package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "market_products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "stock_count", nullable = false)
    private Integer stockCount;

    @Column(nullable = false)
    private boolean active;

    private String barcode;

    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;

    @Column(name = "updated_time")
    private LocalDateTime updatedTime;

    @Column(nullable = false)
    private boolean deleted;
}

