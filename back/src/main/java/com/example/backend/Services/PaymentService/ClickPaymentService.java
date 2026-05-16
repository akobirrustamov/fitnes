package com.example.backend.Services.PaymentService;

import com.example.backend.Entity.Invoice;
import com.example.backend.Entity.UserProfile;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.InvoiceRepo;
import com.example.backend.Repository.UserProfileRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * ClickPaymentService – Click.uz webhook to'lovlarini qabul qilish va qayta ishlash.
 *
 * Endpoints (via ClickWebhookController):
 *   POST /api/v1/click/prepare  – to'lov imkoniyatini tekshirish
 *   POST /api/v1/click/complete – to'lovni tasdiqlash
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClickPaymentService {

    private final InvoiceRepo invoiceRepo;
    private final UserRepo userRepo;
    private final UserProfileRepo userProfileRepo;

    @Value("${click.secret-key:your_click_secret_key}")
    private String secretKey;

    @Value("${click.service-id:0}")
    private String serviceId;

    // ─── Click xato kodlari ────────────────────────────────────
    private static final int OK                  =  0;
    private static final int ERR_SIGN            = -1;
    private static final int ERR_AMOUNT          = -2;
    private static final int ERR_ACTION          = -3;
    private static final int ERR_ALREADY_PAID    = -4;
    private static final int ERR_USER_NOT_FOUND  = -5;
    private static final int ERR_TX_NOT_FOUND    = -6;
    private static final int ERR_UPDATE_FAILED   = -7;

    // ═══════════════════════════════════════════════════════════
    //  PREPARE – To'lov imkoniyatini tekshirish (action = 0)
    // ═══════════════════════════════════════════════════════════
    @Transactional
    public Map<String, Object> prepare(
            String clickTransId,
            String serviceIdParam,
            String clickPaydocId,
            String merchantTransId,
            BigDecimal amount,
            int action,
            String signTime,
            String signString
    ) {
        log.info("📥 Click PREPARE: clickTransId={}, merchantTransId={}, amount={}",
                clickTransId, merchantTransId, amount);

        // 1. Signature tekshirish (prepare)
        String expectedSign = md5(clickTransId + serviceIdParam + secretKey
                + merchantTransId + amount.toPlainString() + action + signTime);

        if (!expectedSign.equals(signString)) {
            log.warn("⛔ Click sign mismatch. Expected={}, Got={}", expectedSign, signString);
            return error(clickTransId, merchantTransId, ERR_SIGN, "SIGN CHECK FAILED");
        }

        // 2. Tashkilotni topish (merchantTransId = organizationId)
        Integer orgId = parseOrgId(merchantTransId);
        if (orgId == null || userRepo.findByNumber(orgId).isEmpty()) {
            return error(clickTransId, merchantTransId, ERR_USER_NOT_FOUND, "USER DOES NOT EXIST");
        }

        // 3. Allaqachon to'langan tekshirish
        if (invoiceRepo.existsByClickTransIdAndStatusNot(clickTransId, "PENDING")) {
            return error(clickTransId, merchantTransId, ERR_ALREADY_PAID, "ALREADY PAID");
        }

        // 4. Invoice yaratish / mavjudini topish
        Invoice invoice = invoiceRepo.findByMerchantTransId(merchantTransId)
                .orElseGet(() -> Invoice.builder()
                        .organizationId(orgId)
                        .amount(amount)
                        .status("PENDING")
                        .clickTransId(clickTransId)
                        .merchantTransId(merchantTransId)
                        .paymentFor("BALANCE")
                        .createdAt(LocalDateTime.now())
                        .build());

        invoice.setMerchantPrepareId(invoice.getId() == null ? null : invoice.getId());
        invoiceRepo.save(invoice);

        log.info("✅ Click PREPARE muvaffaqiyatli. Invoice yaratildi/topildi: {}", invoice.getId());

        return Map.of(
                "click_trans_id",    clickTransId,
                "merchant_trans_id", merchantTransId,
                "merchant_prepare_id", invoice.getId() != null ? invoice.getId() : 0,
                "error",             OK,
                "error_note",        "Success"
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  COMPLETE – To'lovni tasdiqlash (action = 1)
    // ═══════════════════════════════════════════════════════════
    @Transactional
    public Map<String, Object> complete(
            String clickTransId,
            String serviceIdParam,
            String clickPaydocId,
            String merchantTransId,
            Long merchantPrepareId,
            BigDecimal amount,
            int action,
            int error,
            String errorNote,
            String signTime,
            String signString
    ) {
        log.info("📥 Click COMPLETE: clickTransId={}, merchantTransId={}, amount={}, error={}",
                clickTransId, merchantTransId, amount, error);

        // 1. Signature tekshirish (complete)
        String expectedSign = md5(clickTransId + serviceIdParam + secretKey
                + merchantTransId + merchantPrepareId + amount.toPlainString() + action + signTime);

        if (!expectedSign.equals(signString)) {
            log.warn("⛔ Click complete sign mismatch");
            return error(clickTransId, merchantTransId, ERR_SIGN, "SIGN CHECK FAILED");
        }

        // 2. Invoice topish
        Invoice invoice = invoiceRepo.findByMerchantTransId(merchantTransId)
                .orElse(null);
        if (invoice == null) {
            return error(clickTransId, merchantTransId, ERR_TX_NOT_FOUND, "TRANSACTION NOT FOUND");
        }

        // 3. Allaqachon to'langan tekshirish
        if ("COMPLETED".equals(invoice.getStatus())) {
            return error(clickTransId, merchantTransId, ERR_ALREADY_PAID, "ALREADY PAID");
        }

        // 4. Click xatosi bo'lsa — bekor qilish
        if (error != 0) {
            invoice.setStatus("CANCELLED");
            invoiceRepo.save(invoice);
            log.warn("❌ Click to'lov bekor qilindi (error={}): {}", error, errorNote);
            return Map.of(
                    "click_trans_id",       clickTransId,
                    "merchant_trans_id",    merchantTransId,
                    "merchant_confirm_id",  invoice.getId(),
                    "error",                OK,
                    "error_note",           "Cancelled"
            );
        }

        // 5. Miqdor tekshirish
        if (invoice.getAmount().compareTo(amount) != 0) {
            return error(clickTransId, merchantTransId, ERR_AMOUNT, "INCORRECT PARAMETER AMOUNT");
        }

        // 6. Tashkilot profiliga balans qo'shish
        try {
            userRepo.findByNumber(invoice.getOrganizationId())
                    .flatMap(userProfileRepo::findByUser)
                    .ifPresent(up -> {
                        BigDecimal current = up.getBalance() != null ? up.getBalance() : BigDecimal.ZERO;
                        up.setBalance(current.add(amount));
                        userProfileRepo.save(up);
                        log.info("💰 Balans yangilandi: org={}, miqdor={}, yangi balans={}",
                                invoice.getOrganizationId(), amount, up.getBalance());
                    });
        } catch (Exception ex) {
            log.error("❌ Balans yangilashda xato: {}", ex.getMessage(), ex);
            return error(clickTransId, merchantTransId, ERR_UPDATE_FAILED, "FAILED TO UPDATE USER");
        }

        // 7. Invoice ni yakunlash
        invoice.setStatus("COMPLETED");
        invoice.setClickTransId(clickTransId);
        invoice.setMerchantPrepareId(merchantPrepareId);
        invoice.setCompletedAt(LocalDateTime.now());
        invoiceRepo.save(invoice);

        log.info("✅ Click COMPLETE muvaffaqiyatli. Invoice: {}, To'lov: {} UZS",
                invoice.getId(), amount);

        return Map.of(
                "click_trans_id",      clickTransId,
                "merchant_trans_id",   merchantTransId,
                "merchant_confirm_id", invoice.getId(),
                "error",               OK,
                "error_note",          "Success"
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  Helper: Yangi invoice ID generatsiya
    // ═══════════════════════════════════════════════════════════
    public String generateMerchantTransId(Integer organizationId) {
        return organizationId + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    // ─── Private helpers ──────────────────────────────────────

    private Map<String, Object> error(String clickTransId, String merchantTransId,
                                       int code, String note) {
        Map<String, Object> map = new HashMap<>();
        map.put("click_trans_id",    clickTransId);
        map.put("merchant_trans_id", merchantTransId);
        map.put("merchant_confirm_id", null);
        map.put("error",             code);
        map.put("error_note",        note);
        return map;
    }

    private Integer parseOrgId(String merchantTransId) {
        try {
            if (merchantTransId == null) return null;
            String[] parts = merchantTransId.split("_");
            return Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("MD5 hisoblashda xato", e);
        }
    }
}

