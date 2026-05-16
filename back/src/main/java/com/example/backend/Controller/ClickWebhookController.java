package com.example.backend.Controller;

import com.example.backend.Services.PaymentService.ClickPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Click.uz webhook qabul qilish.
 *
 * Click botida sozlash:
 *   Prepare URL: POST /api/v1/click/prepare
 *   Complete URL: POST /api/v1/click/complete
 */
@RestController
@RequestMapping("/api/v1/click")
@RequiredArgsConstructor
@Slf4j
public class ClickWebhookController {

    private final ClickPaymentService clickPaymentService;

    /**
     * Click PREPARE – to'lov imkoniyatini tekshirish
     * Click.uz bu endpointni to'lov boshlanganda chaqiradi (action=0)
     */
    @PostMapping(value = "/prepare", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Map<String, Object>> prepare(
            @RequestParam("click_trans_id")    String clickTransId,
            @RequestParam("service_id")        String serviceId,
            @RequestParam("click_paydoc_id")   String clickPaydocId,
            @RequestParam("merchant_trans_id") String merchantTransId,
            @RequestParam("amount")            BigDecimal amount,
            @RequestParam("action")            int action,
            @RequestParam("sign_time")         String signTime,
            @RequestParam("sign_string")       String signString
    ) {
        Map<String, Object> result = clickPaymentService.prepare(
                clickTransId, serviceId, clickPaydocId,
                merchantTransId, amount, action, signTime, signString);
        return ResponseEntity.ok(result);
    }

    /**
     * Click COMPLETE – to'lovni tasdiqlash
     * Click.uz bu endpointni to'lov yakunlanganida chaqiradi (action=1)
     */
    @PostMapping(value = "/complete", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Map<String, Object>> complete(
            @RequestParam("click_trans_id")      String clickTransId,
            @RequestParam("service_id")          String serviceId,
            @RequestParam("click_paydoc_id")     String clickPaydocId,
            @RequestParam("merchant_trans_id")   String merchantTransId,
            @RequestParam("merchant_prepare_id") Long merchantPrepareId,
            @RequestParam("amount")              BigDecimal amount,
            @RequestParam("action")              int action,
            @RequestParam("error")               int error,
            @RequestParam(value = "error_note", defaultValue = "") String errorNote,
            @RequestParam("sign_time")           String signTime,
            @RequestParam("sign_string")         String signString
    ) {
        Map<String, Object> result = clickPaymentService.complete(
                clickTransId, serviceId, clickPaydocId, merchantTransId,
                merchantPrepareId, amount, action, error, errorNote,
                signTime, signString);
        return ResponseEntity.ok(result);
    }

    /**
     * Yangi invoice uchun merchantTransId generatsiya
     * Tashkilot to'lovni boshlamoqchi bo'lganda chaqiriladi
     */
    @GetMapping("/createInvoice")
    public ResponseEntity<Map<String, Object>> createInvoice(
            @RequestParam Integer organizationId) {
        String merchantTransId = clickPaymentService.generateMerchantTransId(organizationId);
        return ResponseEntity.ok(Map.of(
                "merchantTransId", merchantTransId,
                "serviceId",       "${click.service-id:0}"
        ));
    }
}

