package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "persons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "phone_number")
    private String phoneNumber;

    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private String location;

    @Column(name = "graphic_id")
    private Integer graphicId;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "is_staff", nullable = false)
    private boolean isStaff;

    @Column(name = "subscription_end")
    private LocalDate subscriptionEnd;

    @Column(name = "access_count")
    private Integer accessCount;

    @Column(name = "debt")
    private BigDecimal debt;

    @Column(name = "trainer_id")
    private Long trainerId;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "created_time")
    private LocalDateTime createdTime;

    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
}

