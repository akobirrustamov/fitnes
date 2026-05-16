package com.example.backend.Controller;

import com.example.backend.Payload.req.MonitorChangePasswordRequest;
import com.example.backend.Payload.req.MonitorCreateRequest;
import com.example.backend.Payload.req.MonitorUpdateRequest;
import com.example.backend.Services.MonitorService.MonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/admin/monitors")
public class MonitorController {

    private final MonitorService monitorService;

    // ────────────────────────────────────────────────────────────
    //  6.1  GET /api/v1/admin/monitors/getAll
    //  Auth: [super_admin]
    //  Query: part?, active?, page=1, pageSize=20
    //  200 → { data, totalCount, page, pageSize }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getAll")
    public HttpEntity<?> getAll(
            @RequestParam(required = false) String part,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return monitorService.getAll(part, active, page, pageSize);
    }

    // ────────────────────────────────────────────────────────────
    //  6.2  GET /api/v1/admin/monitors/download
    //  Auth: [super_admin]
    //  Query: part?, active?
    //  200 → Excel file (binary)
    // ────────────────────────────────────────────────────────────
    @GetMapping("/download")
    public HttpEntity<?> download(
            @RequestParam(required = false) String part,
            @RequestParam(required = false) Boolean active) {
        return monitorService.download(part, active);
    }

    // ────────────────────────────────────────────────────────────
    //  6.3  GET /api/v1/admin/monitors/getById/{id}
    //  Auth: [super_admin]
    //  200 → MonitorDetailResponse
    //  404 → { errorCode: "A0018", message }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getById/{id}")
    public HttpEntity<?> getById(@PathVariable Integer id) {
        return monitorService.getById(id);
    }

    // ────────────────────────────────────────────────────────────
    //  6.4  POST /api/v1/admin/monitors/add
    //  Auth: [super_admin]
    //  Body: MonitorCreateRequest
    //  201 → { monitorId, message }
    //  409 → { errorCode: "A0019", message }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/add")
    public HttpEntity<?> add(@RequestBody MonitorCreateRequest request) {
        return monitorService.add(request);
    }

    // ────────────────────────────────────────────────────────────
    //  6.5  PUT /api/v1/admin/monitors/update?id=
    //  Auth: [super_admin]
    //  Body: MonitorUpdateRequest
    //  200 → { monitorId, message }
    // ────────────────────────────────────────────────────────────
    @PutMapping("/update")
    public HttpEntity<?> update(@RequestParam Integer id,
                                @RequestBody MonitorUpdateRequest request) {
        return monitorService.update(id, request);
    }

    // ────────────────────────────────────────────────────────────
    //  6.6  DELETE /api/v1/admin/monitors/delete?id=
    //  Auth: [super_admin]
    //  200 → { message }
    // ────────────────────────────────────────────────────────────
    @DeleteMapping("/delete")
    public HttpEntity<?> delete(@RequestParam Integer id) {
        return monitorService.delete(id);
    }

    // ────────────────────────────────────────────────────────────
    //  6.7  POST /api/v1/admin/monitors/setActive/{id}?active=
    //  Auth: [super_admin]
    //  200 → { monitorId, active, message }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/setActive/{id}")
    public HttpEntity<?> setActive(@PathVariable Integer id,
                                   @RequestParam Boolean active) {
        return monitorService.setActive(id, active);
    }

    // ────────────────────────────────────────────────────────────
    //  6.8  POST /api/v1/admin/monitors/changePassword/{id}
    //  Auth: [super_admin]
    //  Body: { "password": "..." }
    //  200 → { monitorId, message }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/changePassword/{id}")
    public HttpEntity<?> changePassword(@PathVariable Integer id,
                                        @RequestBody MonitorChangePasswordRequest request) {
        return monitorService.changePassword(id, request);
    }

    // ────────────────────────────────────────────────────────────
    //  6.9  POST /api/v1/admin/monitors/addOrganization
    //  Auth: [super_admin]
    //  Query: monitorId, organizationId
    //  200 → { message }
    //  404 → { errorCode: "A0018" or "A0023", message }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/addOrganization")
    public HttpEntity<?> addOrganization(@RequestParam Integer monitorId,
                                         @RequestParam Integer organizationId) {
        return monitorService.addOrganization(monitorId, organizationId);
    }

    // ────────────────────────────────────────────────────────────
    //  6.10 DELETE /api/v1/admin/monitors/removeOrganization
    //  Auth: [super_admin]
    //  Query: monitorId, organizationId
    //  200 → { message }
    //  404 → { errorCode: "A0025", message }
    // ────────────────────────────────────────────────────────────
    @DeleteMapping("/removeOrganization")
    public HttpEntity<?> removeOrganization(@RequestParam Integer monitorId,
                                            @RequestParam Integer organizationId) {
        return monitorService.removeOrganization(monitorId, organizationId);
    }

    // ────────────────────────────────────────────────────────────
    //  6.11 GET /api/v1/admin/monitors/getOrganizations?monitorId=
    //  Auth: [super_admin]
    //  200 → { data, total }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getOrganizations")
    public HttpEntity<?> getOrganizations(@RequestParam Integer monitorId) {
        return monitorService.getOrganizations(monitorId);
    }

    // ────────────────────────────────────────────────────────────
    //  6.12 GET /api/v1/admin/monitors/getUnassignedOrganizations
    //  Auth: [super_admin]
    //  200 → { data, total }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getUnassignedOrganizations")
    public HttpEntity<?> getUnassignedOrganizations() {
        return monitorService.getUnassignedOrganizations();
    }
}

