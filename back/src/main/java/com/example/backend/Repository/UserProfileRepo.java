package com.example.backend.Repository;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    /** Monitorlar ro'yxati: ROLE_MONITOR + filtrlar + paginatsiya */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))")
    Page<UserProfile> findMonitors(
            @Param("role")   UserRoles role,
            @Param("active") Boolean active,
            @Param("part")   String part,
            Pageable pageable);

    /** Monitorlar ro'yxati (paginatsiyasiz, Excel uchun) */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))")
    List<UserProfile> findMonitorsAll(
            @Param("role")   UserRoles role,
            @Param("active") Boolean active,
            @Param("part")   String part);

    /** Monitor tashkilotlari: monitorId bo'yicha, o'chirilmagan */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND up.monitorId = :monitorId ORDER BY u.name ASC")
    List<UserProfile> findOrganizationsByMonitorId(
            @Param("role")      UserRoles role,
            @Param("monitorId") Integer monitorId);

    /** Hech qaysi monitorga biriktirilmagan tashkilotlar (monitorId=0 yoki null) */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (up.monitorId IS NULL OR up.monitorId = 0) ORDER BY u.name ASC")
    List<UserProfile> findUnassignedOrganizations(@Param("role") UserRoles role);

    /** Tashkilotning monitorId sini yangilash */
    @Modifying
    @Transactional
    @Query("UPDATE UserProfile up SET up.monitorId = :monitorId WHERE up.id = :profileId")
    void updateMonitorId(@Param("profileId") UUID profileId, @Param("monitorId") Integer monitorId);

    // ── Region queries ─────────────────────────────────────────────

    /** Tumanlar ro'yxati: ROLE_REGION + filtrlar + paginatsiya */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:provinceId IS NULL OR up.provinceId = :provinceId) " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))")
    Page<UserProfile> findRegions(
            @Param("role")       UserRoles role,
            @Param("provinceId") Integer provinceId,
            @Param("active")     Boolean active,
            @Param("part")       String part,
            Pageable pageable);

    /** Tumanlar ro'yxati (paginatsiyasiz, Excel uchun) */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:provinceId IS NULL OR up.provinceId = :provinceId) " +
           "AND (:active IS NULL OR up.active = :active) " +
           "AND (:part IS NULL OR :part = '' " +
           "      OR LOWER(u.name) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "      OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :part, '%')))")
    List<UserProfile> findRegionsAll(
            @Param("role")       UserRoles role,
            @Param("provinceId") Integer provinceId,
            @Param("active")     Boolean active,
            @Param("part")       String part);

    /** Tuman tashkilotlari: regionId bo'yicha, o'chirilmagan */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND up.regionId = :regionId ORDER BY u.name ASC")
    List<UserProfile> findOrganizationsByRegionId(
            @Param("role")     UserRoles role,
            @Param("regionId") Integer regionId);

    /** Hech qaysi tumanga biriktirilmagan tashkilotlar (regionId=0 yoki null) */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (up.regionId IS NULL OR up.regionId = 0) ORDER BY u.name ASC")
    List<UserProfile> findUnassignedOrganizationsByRegion(@Param("role") UserRoles role);

    // ── Province queries ───────────────────────────────────────────

    /** Viloyatlar ro'yxati: ROLE_PROVINCE + active filter + paginatsiya */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active)")
    Page<UserProfile> findProvinces(
            @Param("role")   UserRoles role,
            @Param("active") Boolean active,
            Pageable pageable);

    /** Viloyatlar ro'yxati (paginatsiyasiz, Excel uchun) */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false " +
           "AND (:active IS NULL OR up.active = :active)")
    List<UserProfile> findProvincesAll(
            @Param("role")   UserRoles role,
            @Param("active") Boolean active);

    /** Berilgan viloyatda region (tuman) bor-yo'qligini tekshirish */
    @Query("SELECT COUNT(up) > 0 FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false AND up.provinceId = :provinceId")
    boolean existsActiveRegionByProvinceId(
            @Param("role")       UserRoles role,
            @Param("provinceId") Integer provinceId);

    /** Obuna muddati boshlanish/tugash orasidagi tashkilotlar */
    @Query("SELECT up FROM UserProfile up JOIN up.user u JOIN u.roles r " +
           "WHERE r.name = :role AND up.deleted = false AND up.active = true " +
           "AND up.subscriptionEndDate IS NOT NULL " +
           "AND up.subscriptionEndDate BETWEEN :fromDate AND :toDate")
    List<UserProfile> findBySubscriptionEndDateBetween(
            @Param("role")     UserRoles role,
            @Param("fromDate") java.time.LocalDate fromDate,
            @Param("toDate")   java.time.LocalDate toDate);
}

