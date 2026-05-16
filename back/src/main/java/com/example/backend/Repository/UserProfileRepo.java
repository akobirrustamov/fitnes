package com.example.backend.Repository;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepo extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUser(User user);

    boolean existsByUser_NameAndUserIdNot(String name, UUID userId);

    /** Tashkilotlar ro'yxati: ROLE_ADMIN + filtrlar + paginatsiya */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:regionId IS NULL OR up.regionId = :regionId) " +
           "AND (:provinceId IS NULL OR up.provinceId = :provinceId) " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:search IS NULL OR :search = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<UserProfile> findOrganizations(
            @Param("role")       UserRoles role,
            @Param("regionId")   Integer regionId,
            @Param("provinceId") Integer provinceId,
            @Param("active")     Boolean active,
            @Param("search")     String search,
            Pageable pageable);
}

