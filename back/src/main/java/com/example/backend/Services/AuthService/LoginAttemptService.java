package com.example.backend.Services.AuthService;
public interface LoginAttemptService {
    /** Muvaffaqiyatsiz urinishni qayd etadi. Agar 5+ urinish bo'lsa, blok o'rnatadi. */
    void recordFailedAttempt(String login);
    /** login bloklangan yoki yo'qligini tekshiradi */
    boolean isBlocked(String login);
    /** Blok tugashiga qancha daqiqa qolganini qaytaradi */
    long getRemainingBlockMinutes(String login);
    /** Muvaffaqiyatli kirish bo'lsa barcha urinishlarni tozalaydi */
    void clearAttempts(String login);
}
