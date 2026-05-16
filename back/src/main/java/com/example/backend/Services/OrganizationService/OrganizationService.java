package com.example.backend.Services.OrganizationService;

import com.example.backend.Payload.req.*;
import org.springframework.http.HttpEntity;

public interface OrganizationService {

    /** GET /api/v1/admin/organizations/getAll */
    HttpEntity<?> getAll(Integer provinceId, Integer regionId,
                         Boolean active, String search,
                         int page, int limit);

    /** GET /api/v1/admin/organizations/getById?id= */
    HttpEntity<?> getById(Integer id);

    /** POST /api/v1/admin/organizations/create */
    HttpEntity<?> create(OrganizationCreateRequest request);

    /** PUT /api/v1/admin/organizations/update?id= */
    HttpEntity<?> update(Integer id, OrganizationUpdateRequest request);

    /** PUT /api/v1/admin/organizations/setActive?id= */
    HttpEntity<?> setActive(Integer id, SetActiveRequest request);

    /** PUT /api/v1/admin/organizations/changePassword?id= */
    HttpEntity<?> changePassword(Integer id, ChangeOrgPasswordRequest request);

    /** DELETE /api/v1/admin/organizations/delete?id= */
    HttpEntity<?> delete(Integer id);
}

