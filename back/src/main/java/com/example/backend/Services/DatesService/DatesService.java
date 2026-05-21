package com.example.backend.Services.DatesService;

import com.example.backend.Payload.req.DateUpdateRequest;
import org.springframework.http.HttpEntity;

public interface DatesService {
    HttpEntity<?> getAll(Integer orgId, Integer month, Integer year);

    HttpEntity<?> update(Integer orgId, Long id, DateUpdateRequest request);

    HttpEntity<?> download(Integer orgId);

    HttpEntity<?> capabilities(Integer orgId);

    HttpEntity<?> generate(Integer orgId, Integer month, Integer year);
}

