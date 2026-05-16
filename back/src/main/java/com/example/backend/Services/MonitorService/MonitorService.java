package com.example.backend.Services.MonitorService;

import com.example.backend.Payload.req.MonitorChangePasswordRequest;
import com.example.backend.Payload.req.MonitorCreateRequest;
import com.example.backend.Payload.req.MonitorUpdateRequest;
import org.springframework.http.HttpEntity;

public interface MonitorService {

    HttpEntity<?> getAll(String part, Boolean active, int page, int pageSize);

    HttpEntity<?> download(String part, Boolean active);

    HttpEntity<?> getById(Integer id);

    HttpEntity<?> add(MonitorCreateRequest request);

    HttpEntity<?> update(Integer id, MonitorUpdateRequest request);

    HttpEntity<?> delete(Integer id);

    HttpEntity<?> setActive(Integer id, Boolean active);

    HttpEntity<?> changePassword(Integer id, MonitorChangePasswordRequest request);

    HttpEntity<?> addOrganization(Integer monitorId, Integer organizationId);

    HttpEntity<?> removeOrganization(Integer monitorId, Integer organizationId);

    HttpEntity<?> getOrganizations(Integer monitorId);

    HttpEntity<?> getUnassignedOrganizations();
}

