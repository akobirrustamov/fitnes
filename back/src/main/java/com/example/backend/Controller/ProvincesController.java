package com.example.backend.Controller;

import com.example.backend.Payload.req.ProvinceChangePasswordRequest;
import com.example.backend.Payload.req.ProvinceCreateRequest;
import com.example.backend.Payload.req.ProvinceUpdateRequest;
import com.example.backend.Services.ProvinceService.ProvinceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/provinces")
@RequiredArgsConstructor
public class ProvincesController {

    private final ProvinceService provinceService;

    /**
     * 8.1 GET /api/v1/admin/provinces/getAll
     * Viloyatlar ro'yxati
     */
    @GetMapping("/getAll")
    public HttpEntity<?> getAll(@RequestParam(required = false) Boolean active) {
        return provinceService.getAll(active);
    }

    /**
     * 8.2 GET /api/v1/admin/provinces/getById/{id}
     * Viloyat to'liq ma'lumotlarini olish
     */
    @GetMapping("/getById/{id}")
    public HttpEntity<?> getById(@PathVariable Integer id) {
        return provinceService.getById(id);
    }

    /**
     * 8.3 POST /api/v1/admin/provinces/add
     * Yangi viloyat yaratish
     */
    @PostMapping("/add")
    public HttpEntity<?> add(@RequestBody ProvinceCreateRequest request) {
        return provinceService.add(request);
    }

    /**
     * 8.4 PUT /api/v1/admin/provinces/update?id=
     * Mavjud viloyatni yangilash
     */
    @PutMapping("/update")
    public HttpEntity<?> update(
            @RequestParam Integer id,
            @RequestBody ProvinceUpdateRequest request) {
        return provinceService.update(id, request);
    }

    /**
     * 8.5 DELETE /api/v1/admin/provinces/delete?id=
     * Viloyatni o'chirish (faqat tumanlar bo'lmasa)
     */
    @DeleteMapping("/delete")
    public HttpEntity<?> delete(@RequestParam Integer id) {
        return provinceService.delete(id);
    }

    /**
     * 8.6 GET /api/v1/admin/provinces/setActive?id=&active=
     * Viloyatni faollashtirish yoki bloklash
     */
    @GetMapping("/setActive")
    public HttpEntity<?> setActive(
            @RequestParam Integer id,
            @RequestParam Boolean active) {
        return provinceService.setActive(id, active);
    }

    /**
     * 8.7 GET /api/v1/admin/provinces/download
     * Viloyatlar ro'yxatini Excel formatda yuklab olish
     */
    @GetMapping("/download")
    public HttpEntity<?> download(@RequestParam(required = false) Boolean active) {
        return provinceService.download(active);
    }

    /**
     * 8.8 POST /api/v1/admin/provinces/changePassword/{id}
     * Viloyat parolini o'zgartirish
     */
    @PostMapping("/changePassword/{id}")
    public HttpEntity<?> changePassword(
            @PathVariable Integer id,
            @RequestBody ProvinceChangePasswordRequest request) {
        return provinceService.changePassword(id, request);
    }
}

