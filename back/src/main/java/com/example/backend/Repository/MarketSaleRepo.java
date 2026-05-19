package com.example.backend.Repository;

import com.example.backend.Entity.MarketSale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketSaleRepo extends JpaRepository<MarketSale, Long> {
    Page<MarketSale> findByOrganizationIdOrderByCreatedTimeDesc(Integer organizationId, Pageable pageable);
}

