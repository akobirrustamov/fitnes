package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer organizationId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String fullname;

    private String phoneNumber;

    @Column(nullable = false)
    private boolean isRegistration;

    @Column(nullable = false)
    private boolean isSeen;

    private Integer markup;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}

