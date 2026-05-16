package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tashkilot users.number */
    private Integer organizationId;

    @Column(precision = 18, scale = 2)
    private BigDecimal amount;

    /** PENDING | COMPLETED | CANCELLED */
    @Column(nullable = false)
    private String status;

    /** Click tranzaksiya ID */
    private String clickTransId;

    /** Bizning ichki tranzaksiya ID */
    private String merchantTransId;

    /** Click prepare ID (complete bosqichida to'ldiriladi) */
    private Long merchantPrepareId;

    /** BALANCE | SUBSCRIPTION | SERVICE */
    private String paymentFor;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;
}

