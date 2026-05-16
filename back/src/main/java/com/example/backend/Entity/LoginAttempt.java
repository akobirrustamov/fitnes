package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String login;

    @Column(nullable = false)
    private int attemptCount;

    @Column(name = "blocked_until")
    private LocalDateTime blockedUntil;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;
}

