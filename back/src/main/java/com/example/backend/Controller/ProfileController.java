package com.example.backend.Controller;

import com.example.backend.Payload.req.ChangePasswordRequest;
import com.example.backend.Payload.req.ProfileUpdateRequest;
import com.example.backend.Services.ProfileService.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/profile/view
    //  Auth: [super_admin, director]
    //  Header: Authorization: <jwt-token>
    //
    //  Director uchun → DirectorProfileResponse
    //  Super admin uchun → SuperAdminProfileResponse
    //  404 → { errorCode: "A0075", message: "Tashkilot topilmadi." }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/view")
    public HttpEntity<?> view(@RequestHeader("Authorization") String token) {
        return profileService.view(token);
    }

    // ────────────────────────────────────────────────────────────
    //  POST /api/v1/profile/update
    //  Auth: [super_admin, director]
    //  Header: Authorization: <jwt-token>
    //  Body: { name, directorName, passwordHint, businessSphere,
    //          phoneNumber, photoUrl, sourcePath, location, description }
    //
    //  200 → { organizationId, message } | { userId, message }
    //  400 → { message: "Name maydoni bo'sh bo'lishi mumkin emas." }
    //  404 → { errorCode: "A0086", message }
    //  409 → { errorCode: "A0087", message }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/update")
    public HttpEntity<?> update(
            @RequestHeader("Authorization") String token,
            @RequestBody ProfileUpdateRequest request) {
        return profileService.update(token, request);
    }

    // ────────────────────────────────────────────────────────────
    //  POST /api/v1/profile/changePassword
    //  Auth: [super_admin, director]
    //  Header: Authorization: <jwt-token>
    //  Body: { "password": "newPassword123" }
    //
    //  200 → { id, message: "Parol muvaffaqiyatli o'zgartirildi." }
    //  404 → { errorCode: "A0095", message }
    //
    //  Parol o'zgartirilganda barcha refresh tokenlar bekor qilinadi.
    //  Foydalanuvchi barcha qurilmalardan qayta login qilishi kerak.
    // ────────────────────────────────────────────────────────────
    @PostMapping("/changePassword")
    public HttpEntity<?> changePassword(
            @RequestHeader("Authorization") String token,
            @RequestBody ChangePasswordRequest request) {
        return profileService.changePassword(token, request);
    }
}

