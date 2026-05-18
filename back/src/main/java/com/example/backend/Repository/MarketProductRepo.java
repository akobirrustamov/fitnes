package com.example.backend.Repository;

import com.example.backend.Entity.MarketProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MarketProductRepo extends JpaRepository<MarketProduct, Long> {

    Page<MarketProduct> findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(Integer organizationId, Pageable pageable);

    Page<MarketProduct> findByOrganizationIdAndCategoryIdAndDeletedFalseOrderByCreatedTimeDesc(Integer organizationId,
                                                                                                Integer categoryId,
                                                                                                Pageable pageable);

    Optional<MarketProduct> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    Optional<MarketProduct> findByIdAndOrganizationIdAndDeletedFalseAndActiveTrue(Long id, Integer organizationId);

    @Query("SELECT DISTINCT p.name FROM MarketProduct p WHERE p.deleted = false ORDER BY p.name")
    List<String> findAllDistinctNames();

    @Query("SELECT DISTINCT p.name FROM MarketProduct p WHERE p.deleted = false AND p.categoryId = :categoryId ORDER BY p.name")
    List<String> findDistinctNamesByCategoryId(@Param("categoryId") Integer categoryId);
}

