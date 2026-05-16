package com.example.backend.Services.PaymentsService;

import com.example.backend.Payload.req.PaymentCreateRequest;
import org.springframework.http.HttpEntity;

public interface PaymentsService {
    HttpEntity<?> getAll(Integer orgId,
                         Long personId,
                         String category,
                         String paymentType,
                         Boolean isImportant,
                         int page,
                         int limit);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> create(Integer orgId, PaymentCreateRequest request);

    HttpEntity<?> delete(Integer orgId, Long id);

    HttpEntity<?> settlePaymentsByPerson(Integer orgId, Long personId);

    HttpEntity<?> settlePayment(Integer orgId, Long id);

    HttpEntity<?> downloadExcel(Integer orgId,
                                Long personId,
                                String category,
                                String paymentType,
                                Boolean isImportant);
}

