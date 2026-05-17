package com.example.backend.Repository;

import com.example.backend.Entity.EventEntry;
import com.example.backend.Projection.EventRowProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventEntryRepo extends JpaRepository<EventEntry, Long> {

    @Query(value = """
            SELECT
                e.id AS id,
                e.person_id AS personId,
                p.full_name AS personName,
                p.photo_url AS personPhoto,
                e.terminal_id AS terminalId,
                t.name AS terminalName,
                e.direction AS direction,
                e.entry_time AS datetime
            FROM entries e
            LEFT JOIN persons p ON p.id = e.person_id
            LEFT JOIN terminals t ON t.id = e.terminal_id
            WHERE e.organization_id = :orgId
              AND (:personId IS NULL OR e.person_id = :personId)
              AND (:terminalId IS NULL OR e.terminal_id = :terminalId)
              AND (:direction IS NULL OR UPPER(e.direction) = :direction)
              AND (:startDate IS NULL OR e.entry_time >= :startDate)
              AND (:endDate IS NULL OR e.entry_time <= :endDate)
            ORDER BY e.entry_time DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM entries e
            WHERE e.organization_id = :orgId
              AND (:personId IS NULL OR e.person_id = :personId)
              AND (:terminalId IS NULL OR e.terminal_id = :terminalId)
              AND (:direction IS NULL OR UPPER(e.direction) = :direction)
              AND (:startDate IS NULL OR e.entry_time >= :startDate)
              AND (:endDate IS NULL OR e.entry_time <= :endDate)
            """,
            nativeQuery = true)
    Page<EventRowProjection> findFiltered(@Param("orgId") Integer orgId,
                                          @Param("personId") Long personId,
                                          @Param("terminalId") Long terminalId,
                                          @Param("direction") String direction,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate,
                                          Pageable pageable);

    @Query(value = """
            SELECT
                e.id AS id,
                e.person_id AS personId,
                p.full_name AS personName,
                p.photo_url AS personPhoto,
                e.terminal_id AS terminalId,
                t.name AS terminalName,
                e.direction AS direction,
                e.entry_time AS datetime
            FROM entries e
            LEFT JOIN persons p ON p.id = e.person_id
            LEFT JOIN terminals t ON t.id = e.terminal_id
            WHERE e.organization_id = :orgId
              AND (:personId IS NULL OR e.person_id = :personId)
              AND (:terminalId IS NULL OR e.terminal_id = :terminalId)
              AND (:direction IS NULL OR UPPER(e.direction) = :direction)
              AND (:startDate IS NULL OR e.entry_time >= :startDate)
              AND (:endDate IS NULL OR e.entry_time <= :endDate)
            ORDER BY e.entry_time DESC
            """,
            nativeQuery = true)
    List<EventRowProjection> findFilteredForExport(@Param("orgId") Integer orgId,
                                                   @Param("personId") Long personId,
                                                   @Param("terminalId") Long terminalId,
                                                   @Param("direction") String direction,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);

    @Query(value = """
            SELECT
                e.id AS id,
                e.person_id AS personId,
                p.full_name AS personName,
                p.photo_url AS personPhoto,
                e.terminal_id AS terminalId,
                t.name AS terminalName,
                e.direction AS direction,
                e.entry_time AS datetime
            FROM entries e
            LEFT JOIN persons p ON p.id = e.person_id
            LEFT JOIN terminals t ON t.id = e.terminal_id
            WHERE e.organization_id = :orgId
              AND e.id = :id
            LIMIT 1
            """, nativeQuery = true)
    Optional<EventRowProjection> findDetail(@Param("orgId") Integer orgId,
                                            @Param("id") Long id);

    @Query(value = """
            SELECT
                e.id AS id,
                e.person_id AS personId,
                p.full_name AS personName,
                p.photo_url AS personPhoto,
                e.terminal_id AS terminalId,
                t.name AS terminalName,
                e.direction AS direction,
                e.entry_time AS datetime
            FROM entries e
            LEFT JOIN persons p ON p.id = e.person_id
            LEFT JOIN terminals t ON t.id = e.terminal_id
            WHERE e.organization_id = :orgId
              AND e.person_id = :personId
            ORDER BY e.entry_time DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<EventRowProjection> findLastByPerson(@Param("orgId") Integer orgId,
                                                  @Param("personId") Long personId);

    @Query(value = """
            SELECT
                e.id AS id,
                e.person_id AS personId,
                p.full_name AS personName,
                p.photo_url AS personPhoto,
                e.terminal_id AS terminalId,
                t.name AS terminalName,
                e.direction AS direction,
                e.entry_time AS datetime
            FROM entries e
            LEFT JOIN persons p ON p.id = e.person_id
            LEFT JOIN terminals t ON t.id = e.terminal_id
            WHERE e.organization_id = :orgId
              AND e.person_id = :personId
            ORDER BY e.entry_time DESC
            LIMIT 10
            """, nativeQuery = true)
    List<EventRowProjection> findTop10ByPerson(@Param("orgId") Integer orgId,
                                               @Param("personId") Long personId);
}

