package com.example.backend.Services.EventsService;

import org.springframework.http.HttpEntity;

public interface EventsService {
    HttpEntity<?> getAll(Integer orgId,
                         Long personId,
                         Long terminalId,
                         String eventType,
                         String startDate,
                         String endDate,
                         int page,
                         int limit);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> getLastByPerson(Integer orgId, Long personId);

    HttpEntity<?> getToday(Integer orgId,
                           Long terminalId,
                           String eventType,
                           int page,
                           int limit);

    HttpEntity<?> downloadExcel(Integer orgId,
                                Long personId,
                                Long terminalId,
                                String eventType,
                                String startDate,
                                String endDate);
}

