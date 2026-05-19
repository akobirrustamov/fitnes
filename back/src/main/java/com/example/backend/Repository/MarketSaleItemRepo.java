package com.example.backend.Repository;

import com.example.backend.Entity.MarketSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketSaleItemRepo extends JpaRepository<MarketSaleItem, Long> {
    List<MarketSaleItem> findBySaleId(Long saleId);
}

