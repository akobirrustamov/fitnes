package com.example.backend.Repository;

import com.example.backend.Entity.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetRequestRepo extends JpaRepository<PasswordResetRequest, Long> {
}

