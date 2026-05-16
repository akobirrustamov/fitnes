package com.example.backend.Services.TrainerService;

import com.example.backend.Payload.req.*;
import org.springframework.http.HttpEntity;

public interface TrainerService {
    HttpEntity<?> getAll(Integer orgId);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> create(Integer orgId, TrainerCreateRequest request);

    HttpEntity<?> update(Integer orgId, Long id, TrainerUpdateRequest request);

    HttpEntity<?> delete(Integer orgId, Long id);

    HttpEntity<?> addStudent(Integer orgId, Long trainerId, TrainerAddStudentRequest request);

    HttpEntity<?> removeStudent(Integer orgId, Long trainerId, Long personId);

    HttpEntity<?> extendStudentSubscription(Integer orgId, Long trainerId, TrainerExtendStudentSubscriptionRequest request);
}

