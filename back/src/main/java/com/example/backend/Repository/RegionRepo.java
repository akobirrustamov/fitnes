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

public interface RegionRepo extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUser_NumberAndDeletedFalse(Integer number);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:provinceId IS NULL OR up.provinceId = :provinceId) " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))"
    )
    Page<UserProfile> findRegions(
            @Param("role") UserRoles role,
            @Param("provinceId") Integer provinceId,
            @Param("active") Boolean active,
            @Param("part") String part,
            Pageable pageable);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:provinceId IS NULL OR up.provinceId = :provinceId) " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))"
    )
    List<UserProfile> findRegionsAll(
            @Param("role") UserRoles role,
            @Param("provinceId") Integer provinceId,
            @Param("active") Boolean active,
            @Param("part") String part);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND up.regionId = :regionId ORDER BY u.name ASC")
    List<UserProfile> findOrganizationsByRegionId(
            @Param("role") UserRoles role,
            @Param("regionId") Integer regionId);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (up.regionId IS NULL OR up.regionId = 0) ORDER BY u.name ASC")
    List<UserProfile> findUnassignedOrganizationsByRegion(@Param("role") UserRoles role);

    @Query("SELECT COUNT(up) > 0 FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false AND up.provinceId = :provinceId")
    boolean existsActiveRegionByProvinceId(
            @Param("role") UserRoles role,
            @Param("provinceId") Integer provinceId);
}

