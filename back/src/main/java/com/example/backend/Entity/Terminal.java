package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "terminals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Terminal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    private String name;
    private String description;
    private String ip;
    private String login;
    private String password;
    private String model;
    private String filter;

    @Column(name = "is_coming", nullable = false)
    private boolean isComing;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_online")
    private LocalDateTime lastOnline;

    @Column(name = "is_online")
    private Boolean isOnline;
}

