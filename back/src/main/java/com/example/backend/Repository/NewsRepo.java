package com.example.backend.Repository;

import com.example.backend.Entity.News;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepo extends JpaRepository<News, Long> {
}

