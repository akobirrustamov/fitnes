package com.example.backend.Services.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
@Service
@Slf4j
public class SmsServiceImpl implements SmsService {
    @Override
    public void sendSms(String phone, String message) {
        // TODO: Real SMS provayderiga ulash (Eskiz.uz yoki SmsPro.uz)
        log.info("[SMS] Raqam: {} | Xabar: {}", phone, message);
        System.out.println("SMS SIMULATION");
        System.out.println("   Raqam : " + phone);
        System.out.println("   Xabar : " + message);
    }
}
