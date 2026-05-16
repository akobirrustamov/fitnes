package com.example.backend.Services.PersonService;

import com.example.backend.Payload.req.*;
import org.springframework.http.HttpEntity;

public interface PersonService {

    HttpEntity<?> getAll(Integer orgId,
                         Boolean isClient,
                         Boolean active,
                         Boolean isExpired,
                         Boolean hasAccessCount,
                         Integer trainerId,
                         String search,
                         int page,
                         int limit);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> create(Integer orgId, PersonCreateRequest request);

    HttpEntity<?> update(Integer orgId, Long id, PersonUpdateRequest request);

    HttpEntity<?> delete(Integer orgId, Long id);

    HttpEntity<?> updatePhoto(Integer orgId, Long id, PersonPhotoUpdateRequest request);

    HttpEntity<?> extendSubscription(Integer orgId, Long id, PersonExtendSubscriptionRequest request);

    HttpEntity<?> payDebt(Integer orgId, Long id, PersonDebtPayRequest request);

    HttpEntity<?> clearAllDebts(Integer orgId, Long id);

    HttpEntity<?> assignTrainer(Integer orgId, Long id, PersonAssignTrainerRequest request);

    HttpEntity<?> refreshInFaceID(Integer orgId, Long id);

    HttpEntity<?> downloadExcel(Integer orgId, Boolean isClient);
}

