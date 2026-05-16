package com.example.backend.Services.AuthService;
public interface SmsService {
    /**
     * Berilgan telefon raqamiga SMS yuboradi.
     * Hozirda development uchun log ga chiqaradi.
     * Production da Eskiz.uz yoki SmsPro.uz API ga ulanish kerak.
     */
    void sendSms(String phone, String message);
}
