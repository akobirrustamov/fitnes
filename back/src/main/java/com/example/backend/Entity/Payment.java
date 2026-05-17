package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    @Column(name = "person_id")
    private Long personId;

    private String category;

    @Column(nullable = false)
    private BigDecimal amount;

    private BigDecimal price;

    @Column(name = "payment_type")
    private String paymentType;

    @Column(name = "is_important", nullable = false)
    private boolean isImportant;

    private String description;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
}

