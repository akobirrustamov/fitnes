package com.example.backend.Repository;

import com.example.backend.Entity.Action;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActionRepo extends JpaRepository<Action, Long> {

    List<Action> findByOrganizationIdAndDeletedFalseOrderByIdDesc(Integer organizationId);

    List<Action> findByOrganizationIdAndPersonIdAndDeletedFalseOrderByIdDesc(Integer organizationId, Integer personId);

    Optional<Action> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    Optional<Action> findByDateAndPersonIdAndDeletedFalse(LocalDate date, Integer personId);

    boolean existsByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    long countByOrganizationIdAndDeletedFalse(Integer organizationId);
}
