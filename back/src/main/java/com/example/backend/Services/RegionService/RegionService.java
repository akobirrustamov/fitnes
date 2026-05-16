package com.example.backend.Services.RegionService;

import com.example.backend.Payload.req.RegionChangePasswordRequest;
import com.example.backend.Payload.req.RegionCreateRequest;
import com.example.backend.Payload.req.RegionUpdateRequest;
import org.springframework.http.HttpEntity;

public interface RegionService {

    HttpEntity<?> getAll(String part, Boolean active, Integer provinceId, int page, int pageSize);

    HttpEntity<?> getById(Integer id);

    HttpEntity<?> add(RegionCreateRequest request);

    HttpEntity<?> update(Integer id, RegionUpdateRequest request);

    HttpEntity<?> delete(Integer id);

    HttpEntity<?> setActive(Integer id, Boolean active);

    HttpEntity<?> download(String part, Boolean active, Integer provinceId);

    HttpEntity<?> changePassword(Integer id, RegionChangePasswordRequest request);

    HttpEntity<?> assignOrganization(Integer regionId, Integer organizationId);

    HttpEntity<?> removeOrganization(Integer regionId, Integer organizationId);

    HttpEntity<?> getUnassignedOrganizations();

    HttpEntity<?> getRegionOrganizations(Integer regionId);
}

