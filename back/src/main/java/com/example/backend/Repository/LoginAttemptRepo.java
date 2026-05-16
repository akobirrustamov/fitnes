package com.example.backend.Repository;

import com.example.backend.Entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoginAttemptRepo extends JpaRepository<LoginAttempt, Long> {
    Optional<LoginAttempt> findByLogin(String login);
}

