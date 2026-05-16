package com.example.backend.Controller;

import com.example.backend.Payload.req.*;
import com.example.backend.Services.OrganizationService.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/admin/organizations")
public class OrganizationsController {

    private final OrganizationService organizationService;

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/admin/organizations/getAll
    //  Auth: [super_admin]
    //  Query: provinceId?, regionId?, active?, search?, page=1, limit=50
    //  200 → PagedResponse<OrganizationListItem>
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getAll")
    public HttpEntity<?> getAll(
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "50") int limit) {
        return organizationService.getAll(provinceId, regionId, active, search, page, limit);
    }

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/admin/organizations/getById?id=5
    //  Auth: [super_admin]
    //  200 → OrganizationDetailResponse
    //  404 → { errorCode: "A0013", message }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getById")
    public HttpEntity<?> getById(@RequestParam Integer id) {
        return organizationService.getById(id);
    }

    // ────────────────────────────────────────────────────────────
    //  POST /api/v1/admin/organizations/create
    //  Auth: [super_admin]
    //  Body: OrganizationCreateRequest
    //  201 → { organizationId, password, message }
    //  400 → { errorCode: "A0014" }
    //  409 → { errorCode: "A0015" }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/create")
    public HttpEntity<?> create(@RequestBody OrganizationCreateRequest request) {
        return organizationService.create(request);
    }

    // ────────────────────────────────────────────────────────────
    //  PUT /api/v1/admin/organizations/update?id=5
    //  Auth: [super_admin]
    //  Body: OrganizationUpdateRequest
    //  200 → { organizationId, message }
    //  404 → { errorCode: "A0016" }
    // ────────────────────────────────────────────────────────────
    @PutMapping("/update")
    public HttpEntity<?> update(@RequestParam Integer id,
                                @RequestBody OrganizationUpdateRequest request) {
        return organizationService.update(id, request);
    }

    // ────────────────────────────────────────────────────────────
    //  PUT /api/v1/admin/organizations/setActive?id=5
    //  Auth: [super_admin]
    //  Body: { "active": true/false }
    //  200 → { organizationId, active, message }
    // ────────────────────────────────────────────────────────────
    @PutMapping("/setActive")
    public HttpEntity<?> setActive(@RequestParam Integer id,
                                   @RequestBody SetActiveRequest request) {
        return organizationService.setActive(id, request);
    }

    // ────────────────────────────────────────────────────────────
    //  PUT /api/v1/admin/organizations/changePassword?id=5
    //  Auth: [super_admin]
    //  Body: { "newPassword": "...", "passwordHint": "..." }
    //  200 → { organizationId, message }
    //  Barcha sessiyalar bekor qilinadi (token rotation).
    // ────────────────────────────────────────────────────────────
    @PutMapping("/changePassword")
    public HttpEntity<?> changePassword(@RequestParam Integer id,
                                        @RequestBody ChangeOrgPasswordRequest request) {
        return organizationService.changePassword(id, request);
    }

    // ────────────────────────────────────────────────────────────
    //  DELETE /api/v1/admin/organizations/delete?id=5
    //  Auth: [super_admin]
    //  200 → { message }
    //  404 → { errorCode: "A0017" }
    //  Soft delete: deleted=true, active=false
    // ────────────────────────────────────────────────────────────
    @DeleteMapping("/delete")
    public HttpEntity<?> delete(@RequestParam Integer id) {
        return organizationService.delete(id);
    }
}

