package com.example.backend.Repository;

import com.example.backend.Entity.Terminal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TerminalRepo extends JpaRepository<Terminal, Long> {

    Optional<Terminal> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    long countByOrganizationIdAndDeletedFalse(Integer organizationId);

    boolean existsByIpAndDeletedFalse(String ip);

    boolean existsByIpAndDeletedFalseAndIdNot(String ip, Long id);

    Page<Terminal> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(Integer organizationId, Pageable pageable);

    @Query("SELECT t FROM Terminal t WHERE t.organizationId = :orgId AND t.deleted = false " +
           "AND (LOWER(COALESCE(t.name, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.ip, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.login, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.model, '')) LIKE LOWER(CONCAT('%', :part, '%'))) " +
           "ORDER BY t.createdAt DESC")
    Page<Terminal> searchByOrganization(@Param("orgId") Integer orgId,
                                        @Param("part") String part,
                                        Pageable pageable);

    List<Terminal> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(Integer organizationId);

    @Query("SELECT t FROM Terminal t WHERE t.organizationId = :orgId AND t.deleted = false " +
           "AND (LOWER(COALESCE(t.name, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.ip, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.login, '')) LIKE LOWER(CONCAT('%', :part, '%')) " +
           "  OR LOWER(COALESCE(t.model, '')) LIKE LOWER(CONCAT('%', :part, '%'))) " +
           "ORDER BY t.createdAt DESC")
    List<Terminal> searchAllByOrganization(@Param("orgId") Integer orgId,
                                           @Param("part") String part);
}

