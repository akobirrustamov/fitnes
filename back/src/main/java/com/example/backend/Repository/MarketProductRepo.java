package com.example.backend.Repository;

import com.example.backend.Entity.MarketProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarketProductRepo extends JpaRepository<MarketProduct, Long> {

    Page<MarketProduct> findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(Integer organizationId, Pageable pageable);

    Page<MarketProduct> findByOrganizationIdAndCategoryIdAndDeletedFalseOrderByCreatedTimeDesc(Integer organizationId,
                                                                                                Integer categoryId,
                                                                                                Pageable pageable);

    Optional<MarketProduct> findByIdAndOrganizationIdAndDeletedFalse(Long id, Integer organizationId);

    Optional<MarketProduct> findByIdAndOrganizationIdAndDeletedFalseAndActiveTrue(Long id, Integer organizationId);
}

