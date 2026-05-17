package com.example.backend.Repository;

import com.example.backend.Entity.OrganizationDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DatesRepo extends JpaRepository<OrganizationDate, Long> {

    List<OrganizationDate> findByOrganizationIdAndDateGreaterThanEqualAndDateLessThanOrderByDateAsc(
            Integer organizationId,
            LocalDate from,
            LocalDate to
    );

    List<OrganizationDate> findByOrganizationIdOrderByDateDesc(Integer organizationId);

    Optional<OrganizationDate> findByIdAndOrganizationId(Long id, Integer organizationId);

    Optional<OrganizationDate> findFirstByOrganizationIdAndDate(Integer organizationId, LocalDate date);
}

