package com.example.backend.Repository;

import com.example.backend.Entity.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsRepo extends JpaRepository<News, Long> {

    @Query(
            value = """
            SELECT public.add_news(
                CAST(:title AS TEXT),
                CAST(:description AS TEXT),
                CAST(:content AS TEXT),
                CAST(:photoUrl AS TEXT),
                CAST(:url AS TEXT)
            )
            """,
            nativeQuery = true
    )
    Integer addNews(
            @Param("title") String title,
            @Param("description") String description,
            @Param("content") String content,
            @Param("photoUrl") String photoUrl,
            @Param("url") String url
    );

    @Query(
            value = """
            SELECT public.update_news(
                :id,
                CAST(:title AS TEXT),
                CAST(:description AS TEXT),
                CAST(:content AS TEXT),
                CAST(:photoUrl AS TEXT),
                CAST(:url AS TEXT)
            )
            """,
            nativeQuery = true
    )
    Integer updateNews(
            @Param("id") Long id,
            @Param("title") String title,
            @Param("description") String description,
            @Param("content") String content,
            @Param("photoUrl") String photoUrl,
            @Param("url") String url
    );

    @Query(
            value = """
            SELECT public.delete_news(:id)
            """,
            nativeQuery = true
    )
    Integer deleteNews(
            @Param("id") Long id
    );

}