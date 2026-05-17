package com.example.backend.Repository;

import com.example.backend.Entity.OrganizationGraphics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationGraphicsRepo extends JpaRepository<OrganizationGraphics, Long> {
    List<OrganizationGraphics> findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(Integer organizationId);

    Optional<OrganizationGraphics> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    boolean existsByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    long countByOrganizationIdAndDeletedFalse(Integer organizationId);
}

