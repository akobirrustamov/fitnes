package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "dates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "is_holiday", nullable = false)
    private boolean isHoliday;

    @Column(name = "is_kanikul", nullable = false)
    private boolean isKanikul;
}

