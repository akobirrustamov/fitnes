package com.example.backend.Controller;

import com.example.backend.Payload.req.RegionChangePasswordRequest;
import com.example.backend.Payload.req.RegionCreateRequest;
import com.example.backend.Payload.req.RegionUpdateRequest;
import com.example.backend.Services.RegionService.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/regions")
@RequiredArgsConstructor
public class RegionsController {

    private final RegionService regionService;

    /**
     * 7.1 GET /api/v1/admin/regions/getAll
     * Tumanlar ro'yxati (filtr va pagination bilan)
     */
    @GetMapping("/getAll")
    public HttpEntity<?> getAll(
            @RequestParam(required = false) String part,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return regionService.getAll(part, active, provinceId, page, pageSize);
    }

    /**
     * 7.2 GET /api/v1/admin/regions/getById/{id}
     * Tuman to'liq ma'lumotlarini olish
     */
    @GetMapping("/getById/{id}")
    public HttpEntity<?> getById(@PathVariable Integer id) {
        return regionService.getById(id);
    }

    /**
     * 7.3 POST /api/v1/admin/regions/add
     * Yangi tuman yaratish
     */
    @PostMapping("/add")
    public HttpEntity<?> add(@RequestBody RegionCreateRequest request) {
        return regionService.add(request);
    }

    /**
     * 7.4 PUT /api/v1/admin/regions/update?id=
     * Mavjud tumanni yangilash
     */
    @PutMapping("/update")
    public HttpEntity<?> update(
            @RequestParam Integer id,
            @RequestBody RegionUpdateRequest request) {
        return regionService.update(id, request);
    }

    /**
     * 7.5 DELETE /api/v1/admin/regions/delete?id=
     * Tumanni o'chirish
     */
    @DeleteMapping("/delete")
    public HttpEntity<?> delete(@RequestParam Integer id) {
        return regionService.delete(id);
    }

    /**
     * 7.6 GET /api/v1/admin/regions/setActive?id=&active=
     * Tumanni faollashtirish yoki bloklash
     */
    @GetMapping("/setActive")
    public HttpEntity<?> setActive(
            @RequestParam Integer id,
            @RequestParam Boolean active) {
        return regionService.setActive(id, active);
    }

    /**
     * 7.7 GET /api/v1/admin/regions/download
     * Tumanlar ro'yxatini Excel formatda yuklab olish
     */
    @GetMapping("/download")
    public HttpEntity<?> download(
            @RequestParam(required = false) String part,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer provinceId) {
        return regionService.download(part, active, provinceId);
    }

    /**
     * 7.8 POST /api/v1/admin/regions/changePassword/{id}
     * Tuman parolini o'zgartirish
     */
    @PostMapping("/changePassword/{id}")
    public HttpEntity<?> changePassword(
            @PathVariable Integer id,
            @RequestBody RegionChangePasswordRequest request) {
        return regionService.changePassword(id, request);
    }

    /**
     * 7.9 POST /api/v1/admin/regions/assignOrganization?regionId=&organizationId=
     * Tashkilotni tumanga biriktirish
     */
    @PostMapping("/assignOrganization")
    public HttpEntity<?> assignOrganization(
            @RequestParam Integer regionId,
            @RequestParam Integer organizationId) {
        return regionService.assignOrganization(regionId, organizationId);
    }

    /**
     * 7.10 DELETE /api/v1/admin/regions/removeOrganization?regionId=&organizationId=
     * Tashkilotni tumandan uzish
     */
    @DeleteMapping("/removeOrganization")
    public HttpEntity<?> removeOrganization(
            @RequestParam Integer regionId,
            @RequestParam Integer organizationId) {
        return regionService.removeOrganization(regionId, organizationId);
    }

    /**
     * 7.11 GET /api/v1/admin/regions/getUnassignedOrganizations
     * Hech qaysi tumanga biriktirilmagan tashkilotlar
     */
    @GetMapping("/getUnassignedOrganizations")
    public HttpEntity<?> getUnassignedOrganizations() {
        return regionService.getUnassignedOrganizations();
    }

    /**
     * 7.12 GET /api/v1/admin/regions/getRegionOrganizations?regionId=
     * Tuman tashkilotlari ro'yxati
     */
    @GetMapping("/getRegionOrganizations")
    public HttpEntity<?> getRegionOrganizations(@RequestParam Integer regionId) {
        return regionService.getRegionOrganizations(regionId);
    }
}

