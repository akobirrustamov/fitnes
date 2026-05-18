package com.example.backend.Services.MarketService;

import com.example.backend.Payload.req.*;
import org.springframework.http.HttpEntity;

public interface MarketService {
    HttpEntity<?> getAll(Integer orgId, Integer categoryId, int page, int limit);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> create(Integer orgId, MarketProductCreateRequest request);

    HttpEntity<?> update(Integer orgId, Long id, MarketProductUpdateRequest request);

    HttpEntity<?> delete(Integer orgId, Long id);

    HttpEntity<?> sell(Integer orgId, MarketSellRequest request);

    HttpEntity<?> getSuggestions(Integer categoryId);
}

