package com.example.backend.Repository;

import com.example.backend.Entity.ApiSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApiSettingsRepo extends JpaRepository<ApiSettings, Long> {
    Optional<ApiSettings> findTopByOrderByIdDesc();
}

