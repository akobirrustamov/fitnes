package com.example.backend.Repository;

import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonitorRepo extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUser_NumberAndDeletedFalse(Integer number);


    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))"
    )
    Page<UserProfile> findMonitors(
            @Param("role") UserRoles role,
            @Param("active") Boolean active,
            @Param("part") String part,
            Pageable pageable);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))"
    )
    List<UserProfile> findMonitorsAll(
            @Param("role") UserRoles role,
            @Param("active") Boolean active,
            @Param("part") String part);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND up.monitorId = :monitorId ORDER BY u.name ASC")
    List<UserProfile> findOrganizationsByMonitorId(
            @Param("role") UserRoles role,
            @Param("monitorId") Integer monitorId);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (up.monitorId IS NULL OR up.monitorId = 0) ORDER BY u.name ASC")
    List<UserProfile> findUnassignedOrganizations(@Param("role") UserRoles role);
}

