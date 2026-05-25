package com.example.backend.Services.ActionService;

import org.springframework.http.HttpEntity;

public interface ActionService {

    HttpEntity<?> getAll(Integer orgId, Integer personId);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> create(Integer orgId, java.util.Map<String, Object> request);

    HttpEntity<?> update(Integer orgId, Long id, java.util.Map<String, Object> request);

    HttpEntity<?> delete(Integer orgId, Long id);
}
