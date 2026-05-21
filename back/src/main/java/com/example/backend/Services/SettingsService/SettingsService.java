package com.example.backend.Services.SettingsService;

import org.springframework.http.HttpEntity;

public interface SettingsService {
    HttpEntity<?> getByOrgId(Integer orgId);
    HttpEntity<?> update(Integer orgId, java.util.Map<String, Object> body, boolean superAdmin);
}
