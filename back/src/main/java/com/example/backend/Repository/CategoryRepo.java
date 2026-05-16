package com.example.backend.Repository;

import com.example.backend.Entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepo extends JpaRepository<Category, Integer> {

    boolean existsByNameUz(String nameUz);

    boolean existsByNameUzAndIdNot(String nameUz, Integer id);

    Optional<Category> findByNameUz(String nameUz);
}

