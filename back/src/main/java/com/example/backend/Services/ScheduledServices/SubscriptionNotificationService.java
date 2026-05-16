package com.example.backend.Services.ScheduledServices;

import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.UserProfileRepo;
import com.example.backend.Services.AuthService.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * SubscriptionNotificationService – har kuni soat 09:00 da
 * obuna muddati tugayotgan tashkilotlarga bildirishnoma yuboradi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionNotificationService {

    private final UserProfileRepo userProfileRepo;
    private final SmsService smsService;

    @Scheduled(cron = "0 0 9 * * *")
    public void checkSubscriptions() {
        LocalDate today = LocalDate.now();
        log.info("🔔 SubscriptionNotificationService ishga tushdi. Bugun: {}", today);

        int notified = 0;

        // 7 kun ichida tugaydigan obunalar (7 kun ogohlantirish)
        notified += notify(today.plusDays(7), today.plusDays(7),
                7, "⚠️ Obunangiz 7 kun ichida tugaydi!");

        // 3 kun qolganda ogohlantirish
        notified += notify(today.plusDays(3), today.plusDays(3),
                3, "⚠️ Obunangizga 3 kun qoldi!");

        // 1 kun qolganda final ogohlantirish
        notified += notify(today.plusDays(1), today.plusDays(1),
                1, "🚨 Obunangizga faqat 1 kun qoldi!");

        // Obuna tugaganidan keyin (0 dan -3 kungacha) — eslatma
        notified += notify(today.minusDays(3), today.minusDays(1),
                0, "❌ Obunangiz tugagan. Iltimos, yangilang!");

        log.info("✅ SubscriptionNotificationService tugadi. Bildirishnomalar: {}", notified);
    }

    /**
     * Berilgan sana oralig'idagi tashkilotlarga bildirishnoma yuboradi
     */
    private int notify(LocalDate from, LocalDate to, int daysLeft, String templateMsg) {
        List<UserProfile> targets = userProfileRepo.findBySubscriptionEndDateBetween(
                UserRoles.ROLE_ADMIN, from, to);

        for (UserProfile up : targets) {
            String orgName = up.getUser() != null ? up.getUser().getName() : "Tashkilot";
            String phone   = up.getPhoneNumber();
            LocalDate endDate = up.getSubscriptionEndDate();

            String message = String.format(
                    "%s: %s Muddati: %s",
                    orgName, templateMsg, endDate != null ? endDate.toString() : "noma'lum");

            // SMS yuborish
            if (phone != null && !phone.isBlank()) {
                try {
                    smsService.sendSms(phone, message);
                    log.info("📱 SMS yuborildi: {} → {}", orgName, phone);
                } catch (Exception e) {
                    log.warn("SMS yuborishda xato ({}): {}", phone, e.getMessage());
                }
            }

            // Telegram bot bildirishnomasi (agar aktiv bo'lsa)
            if (up.isTelegramBotActive()) {
                log.info("📨 Telegram bildirishnoma: {} (telegramBotActive=true)", orgName);
                // TODO: Telegram bot API integratsiya
            }

            log.info("🔔 Bildirishnoma ({} kun): {}, tugash: {}",
                    daysLeft > 0 ? daysLeft : "O'TDI", orgName, endDate);
        }

        return targets.size();
    }
}

