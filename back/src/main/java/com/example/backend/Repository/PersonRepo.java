package com.example.backend.Repository;

import com.example.backend.Entity.Person;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonRepo extends JpaRepository<Person, Long>, JpaSpecificationExecutor<Person> {

    List<Person> findByOrganizationIdAndDeletedFalseAndTrainerIdOrderByIdDesc(Integer organizationId, Long trainerId);

    Optional<Person> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    boolean existsByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    long countByOrganizationIdAndDeletedFalseAndTrainerId(Integer organizationId, Long trainerId);

    long countByOrganizationIdAndDeletedFalse(Integer organizationId);

    long countByOrganizationIdAndDeletedFalseAndGraphicId(Integer organizationId, Integer graphicId);

    Optional<Person> findByPhoneNumberAndDeletedFalse(String phoneNumber);

    @Modifying
    @Query("update Person p set p.trainerId = null where p.organizationId = :orgId and p.trainerId = :trainerId and p.deleted = false")
    int clearTrainerByTrainerId(@Param("orgId") Integer orgId, @Param("trainerId") Long trainerId);

    @Modifying
    @Query("update Person p set p.trainerId = null where p.id = :personId and p.organizationId = :orgId and p.trainerId = :trainerId and p.deleted = false")
    int clearTrainerByPersonId(@Param("orgId") Integer orgId,
                               @Param("trainerId") Long trainerId,
                               @Param("personId") Long personId);
}

