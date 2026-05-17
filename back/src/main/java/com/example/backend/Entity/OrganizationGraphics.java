package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "organization_graphics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationGraphics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "is_monday", nullable = false)
    private boolean monday;

    @Column(name = "is_tuesday", nullable = false)
    private boolean tuesday;

    @Column(name = "is_wednesday", nullable = false)
    private boolean wednesday;

    @Column(name = "is_thursday", nullable = false)
    private boolean thursday;

    @Column(name = "is_friday", nullable = false)
    private boolean friday;

    @Column(name = "is_saturday", nullable = false)
    private boolean saturday;

    @Column(name = "is_sunday", nullable = false)
    private boolean sunday;

    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;

    @Column(name = "updated_time")
    private LocalDateTime updatedTime;

    @Column(nullable = false)
    private boolean deleted;
}

