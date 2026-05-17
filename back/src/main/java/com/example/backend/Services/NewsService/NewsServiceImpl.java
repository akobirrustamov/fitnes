package com.example.backend.Services.NewsService;

import com.example.backend.Entity.NewsOrganization;
import com.example.backend.Projection.NewsDetailProjection;
import com.example.backend.Projection.NewsListItemProjection;
import com.example.backend.Repository.NewsOrganizationRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsServiceImpl implements NewsService {

    private final NewsOrganizationRepo newsOrganizationRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId, int page, int pageSize, Boolean isRead) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.min(500, Math.max(1, pageSize));
        PageRequest pageable = PageRequest.of(safePage - 1, safePageSize);

        Page<NewsListItemProjection> pageResult = newsOrganizationRepo.findNewsForOrganization(orgId, isRead, pageable);
        List<Map<String, Object>> items = pageResult.getContent().stream().map(this::toListMap).toList();

        return ResponseEntity.ok(Map.of(
                "items", items,
                "totalCount", pageResult.getTotalElements(),
                "page", safePage,
                "pageSize", safePageSize
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long newsId) {
        return newsOrganizationRepo.findDetail(orgId, newsId)
                .<HttpEntity<?>>map(detail -> ResponseEntity.ok(toDetailMap(detail)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Yangilik topilmadi")));
    }

    @Override
    @Transactional
    public HttpEntity<?> markAsRead(Integer orgId, Long newsId) {
        NewsOrganization newsOrganization = newsOrganizationRepo.findByOrganizationIdAndNews_Id(orgId, newsId)
                .orElse(null);

        if (newsOrganization == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Yangilik topilmadi"));
        }

        newsOrganization.setRead(true);
        newsOrganizationRepo.save(newsOrganization);

        return ResponseEntity.ok(Map.of("message", "Yangilik o'qilgan deb belgilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> markAllAsRead(Integer orgId) {
        newsOrganizationRepo.markAllAsRead(orgId);
        return ResponseEntity.ok(Map.of("message", "Barcha yangiliklar o'qilgan deb belgilandi"));
    }

    @Override
    public HttpEntity<?> getUnreadCount(Integer orgId) {
        long unread = newsOrganizationRepo.countUnread(orgId);
        return ResponseEntity.ok(Map.of("unreadCount", unread));
    }

    private Map<String, Object> toListMap(NewsListItemProjection item) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("newsId", item.getNewsId());
        row.put("title", item.getTitle());
        row.put("description", item.getDescription());
        row.put("content", item.getContent());
        row.put("photoUrl", item.getPhotoUrl());
        row.put("url", item.getUrl());
        row.put("startTime", item.getStartTime() == null ? null : item.getStartTime().toString());
        row.put("endTime", item.getEndTime() == null ? null : item.getEndTime().toString());
        row.put("isRead", item.getIsRead());
        row.put("createdTime", item.getCreatedTime() == null ? null : item.getCreatedTime().toString());
        return row;
    }

    private Map<String, Object> toDetailMap(NewsDetailProjection item) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("newsId", item.getNewsId());
        row.put("title", item.getTitle());
        row.put("description", item.getDescription());
        row.put("content", item.getContent());
        row.put("photoUrl", item.getPhotoUrl());
        row.put("url", item.getUrl());
        row.put("isRead", item.getIsRead());
        return row;
    }
}
