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

public interface ProvinceRepo extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUser_NumberAndDeletedFalse(Integer number);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active)")
    Page<UserProfile> findProvinces(
            @Param("role") UserRoles role,
            @Param("active") Boolean active,
            Pageable pageable);

    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active)")
    List<UserProfile> findProvincesAll(
            @Param("role") UserRoles role,
            @Param("active") Boolean active);

    @Query("SELECT COUNT(up) > 0 FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false AND up.provinceId = :provinceId")
    boolean existsActiveRegionByProvinceId(
            @Param("role") UserRoles role,
            @Param("provinceId") Integer provinceId);
}

