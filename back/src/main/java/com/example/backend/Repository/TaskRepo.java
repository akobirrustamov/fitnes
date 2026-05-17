package com.example.backend.Repository;

import com.example.backend.Entity.TerminalTask;
import com.example.backend.Projection.TaskRowProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepo extends JpaRepository<TerminalTask, Long> {

    @Query(value = """
            SELECT
                tt.id AS id,
                tt.terminal_id AS terminalId,
                t.name AS terminalName,
                tt.person_id AS personId,
                p.full_name AS personName,
                tt.action AS action,
                tt.status AS status,
                tt.created_at AS createdTime
            FROM terminal_tasks tt
            JOIN terminals t ON t.id = tt.terminal_id
            LEFT JOIN persons p ON p.id = tt.person_id
            WHERE t.organization_id = :orgId
              AND t.deleted = false
              AND (:terminalId IS NULL OR tt.terminal_id = :terminalId)
              AND (:status IS NULL OR LOWER(tt.status) = LOWER(:status))
              AND (:action IS NULL OR LOWER(tt.action) = LOWER(:action))
            ORDER BY tt.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM terminal_tasks tt
            JOIN terminals t ON t.id = tt.terminal_id
            WHERE t.organization_id = :orgId
              AND t.deleted = false
              AND (:terminalId IS NULL OR tt.terminal_id = :terminalId)
              AND (:status IS NULL OR LOWER(tt.status) = LOWER(:status))
              AND (:action IS NULL OR LOWER(tt.action) = LOWER(:action))
            """,
            nativeQuery = true)
    Page<TaskRowProjection> findFiltered(@Param("orgId") Integer orgId,
                                         @Param("terminalId") Long terminalId,
                                         @Param("status") String status,
                                         @Param("action") String action,
                                         Pageable pageable);


    @Query(value = """
            SELECT
                tt.id AS id,
                tt.terminal_id AS terminalId,
                t.name AS terminalName,
                tt.person_id AS personId,
                p.full_name AS personName,
                tt.action AS action,
                tt.status AS status,
                tt.created_at AS createdTime
            FROM terminal_tasks tt
            JOIN terminals t ON t.id = tt.terminal_id
            LEFT JOIN persons p ON p.id = tt.person_id
            WHERE tt.id = :id
              AND t.organization_id = :orgId
              AND t.deleted = false
            LIMIT 1
            """, nativeQuery = true)
    Optional<TaskRowProjection> findDetail(@Param("orgId") Integer orgId,
                                           @Param("id") Long id);

    @Query(value = """
            SELECT
                tt.id AS id,
                tt.terminal_id AS terminalId,
                t.name AS terminalName,
                tt.person_id AS personId,
                p.full_name AS personName,
                tt.action AS action,
                tt.status AS status,
                tt.created_at AS createdTime
            FROM terminal_tasks tt
            JOIN terminals t ON t.id = tt.terminal_id
            LEFT JOIN persons p ON p.id = tt.person_id
            WHERE tt.person_id = :personId
              AND t.organization_id = :orgId
              AND t.deleted = false
            ORDER BY tt.created_at DESC
            """, nativeQuery = true)
    List<TaskRowProjection> findByPerson(@Param("orgId") Integer orgId,
                                         @Param("personId") Long personId);
}

