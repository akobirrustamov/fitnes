package com.example.backend.Services.AuthService;

import com.example.backend.DTO.UserDTO;
import com.example.backend.Entity.User;
import com.example.backend.Payload.req.LoginRequest;
import com.example.backend.Payload.req.RefreshTokenRequest;
import org.springframework.http.HttpEntity;

import java.util.UUID;

public interface AuthService {

    // ── Spec-ga mos yangi endpointlar ──────────────────────────
    /** POST /api/v1/auth/login */
    HttpEntity<?> login(LoginRequest request);

    /** POST /api/v1/auth/refreshToken */
    HttpEntity<?> refreshToken(RefreshTokenRequest request);

    /** POST /api/v1/auth/logOut  (token header-dan) */
    HttpEntity<?> logOut(String token);

    /** GET /api/v1/auth/changePasswordRequest?login= */
    HttpEntity<?> changePasswordRequest(String login);

    /** GET /api/v1/auth/acceptSmsCode?reqid=&code= */
    HttpEntity<?> acceptSmsCode(Long reqId, String code);

    // ── Mavjud utility metod-lar (backward-compat) ─────────────
    /** Legacy login (UserDTO bilan) */
    HttpEntity<?> login(UserDTO dto);

    /** Legacy refresh (?refreshToken=...) */
    HttpEntity<?> refreshToken(String refreshToken);

    User decode(String token);

    User password(UUID adminId, String password);

    User changeRole(String token, Integer roleId);
}
