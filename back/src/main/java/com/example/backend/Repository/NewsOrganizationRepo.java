package com.example.backend.Repository;

import com.example.backend.Entity.NewsOrganization;
import com.example.backend.Projection.NewsDetailProjection;
import com.example.backend.Projection.NewsListItemProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NewsOrganizationRepo extends JpaRepository<NewsOrganization, Long> {

    @Query(value = """
            SELECT
                n.id AS newsId,
                n.title AS title,
                n.description AS description,
                n.content AS content,
                n.photo_url AS photoUrl,
                n.url AS url,
                n.start_time AS startTime,
                n.end_time AS endTime,
                no2.is_read AS isRead,
                n.created_at AS createdTime
            FROM news_organizations no2
            JOIN news n ON n.id = no2.news_id
            WHERE no2.organization_id = :orgId
              AND n.active = true
              AND (n.end_time IS NULL OR n.end_time > NOW())
              AND (:isRead IS NULL OR no2.is_read = :isRead)
            ORDER BY n.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM news_organizations no2
            JOIN news n ON n.id = no2.news_id
            WHERE no2.organization_id = :orgId
              AND n.active = true
              AND (n.end_time IS NULL OR n.end_time > NOW())
              AND (:isRead IS NULL OR no2.is_read = :isRead)
            """,
            nativeQuery = true)
    Page<NewsListItemProjection> findNewsForOrganization(@Param("orgId") Integer orgId,
                                                          @Param("isRead") Boolean isRead,
                                                          Pageable pageable);

    @Query(value = """
            SELECT
                n.id AS newsId,
                n.title AS title,
                n.description AS description,
                n.content AS content,
                n.photo_url AS photoUrl,
                n.url AS url,
                no2.is_read AS isRead
            FROM news_organizations no2
            JOIN news n ON n.id = no2.news_id
            WHERE no2.organization_id = :orgId
              AND n.id = :newsId
            LIMIT 1
            """,
            nativeQuery = true)
    Optional<NewsDetailProjection> findDetail(@Param("orgId") Integer orgId,
                                              @Param("newsId") Long newsId);

    Optional<NewsOrganization> findByOrganizationIdAndNews_Id(Integer organizationId, Long newsId);

    void deleteByNews_Id(Long newsId);

    @Modifying
    @Query("update NewsOrganization no set no.isRead = true where no.organizationId = :orgId and no.isRead = false")
    int markAllAsRead(@Param("orgId") Integer orgId);

    @Query("select count(no) from NewsOrganization no join no.news n where no.organizationId = :orgId and no.isRead = false and n.active = true and (n.endTime is null or n.endTime > current_timestamp)")
    long countUnread(@Param("orgId") Integer orgId);

    @Query(value = """
            SELECT
                n.id AS newsId,
                n.title AS title,
                n.description AS description,
                n.content AS content,
                n.photo_url AS photoUrl,
                n.url AS url,
                n.start_time AS startTime,
                n.end_time AS endTime,
                n.active AS isRead,
                n.created_at AS createdTime
            FROM news n
            ORDER BY n.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM news n
            """,
            nativeQuery = true)
    Page<NewsListItemProjection> findAllNewsForAdmin(Pageable pageable);
}

