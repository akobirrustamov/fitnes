package com.example.backend.Repository;

import com.example.backend.Entity.MarketSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketSaleItemRepo extends JpaRepository<MarketSaleItem, Long> {
}

