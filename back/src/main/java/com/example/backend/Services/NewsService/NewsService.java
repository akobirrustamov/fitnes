package com.example.backend.Services.NewsService;

import com.example.backend.Payload.req.NewsCreateRequest;
import com.example.backend.Payload.req.NewsUpdateRequest;
import org.springframework.http.HttpEntity;

public interface NewsService {
    HttpEntity<?> getAll(Integer orgId, int page, int pageSize, Boolean isRead);

    HttpEntity<?> getById(Integer orgId, Long newsId);

    HttpEntity<?> markAsRead(Integer orgId, Long newsId);

    HttpEntity<?> markAllAsRead(Integer orgId);

    HttpEntity<?> getUnreadCount(Integer orgId);

    HttpEntity<?> create(NewsCreateRequest request);

    HttpEntity<?> update(Long id, NewsUpdateRequest request);

    HttpEntity<?> delete(Long id);
}

