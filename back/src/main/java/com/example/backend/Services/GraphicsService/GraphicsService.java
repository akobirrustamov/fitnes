package com.example.backend.Services.GraphicsService;

import com.example.backend.Payload.req.GraphicsRequest;
import org.springframework.http.HttpEntity;

public interface GraphicsService {
    HttpEntity<?> getAll(Integer orgId);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> create(Integer orgId, GraphicsRequest request);

    HttpEntity<?> update(Integer orgId, Long id, GraphicsRequest request);

    HttpEntity<?> delete(Integer orgId, Long id);

    HttpEntity<?> downloadExcel(Integer orgId);
}

