package com.example.backend.Services.ProfileService;

import com.example.backend.Payload.req.ChangePasswordRequest;
import com.example.backend.Payload.req.ProfileUpdateRequest;
import org.springframework.http.HttpEntity;

public interface ProfileService {

    /**
     * GET /api/v1/profile/view
     * Joriy foydalanuvchi profilini qaytaradi.
     * Director uchun → DirectorProfileResponse
     * Super admin uchun → SuperAdminProfileResponse
     *
     * @param token Authorization header-dan olingan JWT
     */
    HttpEntity<?> view(String token);

    /**
     * POST /api/v1/profile/update
     * Joriy foydalanuvchi profilini yangilaydi.
     *
     * @param token   Authorization header-dan olingan JWT
     * @param request Yangilash maydonlari
     */
    HttpEntity<?> update(String token, ProfileUpdateRequest request);

    /**
     * POST /api/v1/profile/changePassword
     * Parolni o'zgartiradi va barcha refresh tokenlarni bekor qiladi.
     *
     * @param token   Authorization header-dan olingan JWT
     * @param request Yangi parol
     */
    HttpEntity<?> changePassword(String token, ChangePasswordRequest request);
}

