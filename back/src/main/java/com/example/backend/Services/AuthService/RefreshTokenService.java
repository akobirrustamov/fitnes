package com.example.backend.Services.AuthService;
import com.example.backend.Entity.RefreshToken;
import com.example.backend.Entity.User;
public interface RefreshTokenService {
    /** Yangi refresh token yaratadi va DBga saqlaydi */
    RefreshToken create(User user);
    /** Token ni DBdan topadi va validatsiya qiladi; muddati o'tgan yoki revoked bo'lsa exception */
    RefreshToken validateAndGet(String token);
    /** Token ni revoke qiladi */
    void revoke(RefreshToken token);
    /** Foydalanuvchining barcha refresh tokenlarini revoke qiladi */
    void revokeAllByUser(User user);
}
