package com.example.backend.Services.TasksService;

import org.springframework.http.HttpEntity;

public interface TasksService {
    HttpEntity<?> getAll(Integer orgId,
                         Long terminalId,
                         String waiting,
                         String taskType,
                         int page,
                         int pageSize);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> getByPerson(Integer orgId, Long personId);
}

