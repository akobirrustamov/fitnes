package com.example.backend.Repository;

import com.example.backend.Entity.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainerRepo extends JpaRepository<Trainer, Long> {
    List<Trainer> findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(Integer organizationId);

    Optional<Trainer> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    boolean existsByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);
}

