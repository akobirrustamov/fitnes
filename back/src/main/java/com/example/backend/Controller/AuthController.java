package com.example.backend.Controller;

import com.example.backend.DTO.UserDTO;
import com.example.backend.Payload.req.LoginRequest;
import com.example.backend.Payload.req.RefreshTokenRequest;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Security.JwtService;
import com.example.backend.Services.AuthService.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService service;
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final RoleRepo roleRepo;

    // ────────────────────────────────────────────────────────────
    //  1. POST /api/v1/auth/login
    //     Body: { "username": "...", "password": "..." }
    //     Response: { accessToken, refreshToken, userId, roleId, roleName, expiresIn }
    // ────────────────────────────────────────────────────────────
    @PostMapping(value = "/login", consumes = "application/json")
    public HttpEntity<?> login(@RequestBody LoginRequest request) {
        return service.login(request);
    }

    // ────────────────────────────────────────────────────────────
    //  2. POST /api/v1/auth/refreshToken
    //     Body: { "refreshToken": "..." }
    //     Response: { accessToken, refreshToken, expiresIn }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/refreshToken")
    public HttpEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        return service.refreshToken(request);
    }

    // ────────────────────────────────────────────────────────────
    //  3. POST /api/v1/auth/logOut
    //     Header: token: <access-token>
    //     Response: { message: "Tizimdan muvaffaqiyatli chiqildi" }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/logOut")
    public HttpEntity<?> logOut(@RequestHeader("token") String token) {
        return service.logOut(token);
    }

    // ────────────────────────────────────────────────────────────
    //  4. GET /api/v1/auth/changePasswordRequest?login=...
    //     Response: { reqId: 12345, message: "SMS kod yuborildi" }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/changePasswordRequest")
    public HttpEntity<?> changePasswordRequest(@RequestParam String login) {
        return service.changePasswordRequest(login);
    }

    // ────────────────────────────────────────────────────────────
    //  5. GET /api/v1/auth/acceptSmsCode?reqid=12345&code=1234
    //     Response: { newPassword: "abc123def", message: "Parol muvaffaqiyatli tiklandi" }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/acceptSmsCode")
    public HttpEntity<?> acceptSmsCode(@RequestParam Long reqid, @RequestParam String code) {
        return service.acceptSmsCode(reqid, code);
    }

    // ────────────────────────────────────────────────────────────
    //  Legacy endpointlar (mavjud kodni buzmaslik uchun)
    // ────────────────────────────────────────────────────────────

    /** Legacy: POST /api/v1/auth/refresh?refreshToken=... */
    @PostMapping("/refresh")
    public HttpEntity<?> refreshLegacy(@RequestParam String refreshToken) {
        return service.refreshToken(refreshToken);
    }

    /** GET /api/v1/auth/decode  —  Header: Authorization: <token> */
    @GetMapping("/decode")
    public HttpEntity<?> decode(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(service.decode(token));
    }

    /** PUT /api/v1/auth/change-role/{roleId} */
    @PutMapping("/change-role/{roleId}")
    public HttpEntity<?> changeRole(@RequestHeader("Authorization") String token,
                                    @PathVariable Integer roleId) {
        return ResponseEntity.ok(service.changeRole(token, roleId));
    }

    /** PUT /api/v1/auth/password/{adminId} */
    @PutMapping("/password/{adminId}")
    public HttpEntity<?> password(@RequestBody PasswordUpdateRequest request,
                                  @PathVariable UUID adminId) {
        return ResponseEntity.ok(service.password(adminId, request.getPassword()));
    }

    // Inner DTO (legacy)
    public static class PasswordUpdateRequest {
        private String password;

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}