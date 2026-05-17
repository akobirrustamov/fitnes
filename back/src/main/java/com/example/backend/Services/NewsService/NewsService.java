package com.example.backend.Services.NewsService;

import org.springframework.http.HttpEntity;

public interface NewsService {
    HttpEntity<?> getAll(Integer orgId, int page, int pageSize, Boolean isRead);

    HttpEntity<?> getById(Integer orgId, Long newsId);

    HttpEntity<?> markAsRead(Integer orgId, Long newsId);

    HttpEntity<?> markAllAsRead(Integer orgId);

    HttpEntity<?> getUnreadCount(Integer orgId);
}

