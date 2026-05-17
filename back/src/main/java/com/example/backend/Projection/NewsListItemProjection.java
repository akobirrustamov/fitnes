package com.example.backend.Projection;

import java.time.LocalDateTime;

public interface NewsListItemProjection {
    Long getNewsId();
    String getTitle();
    String getDescription();
    String getContent();
    String getPhotoUrl();
    String getUrl();
    LocalDateTime getStartTime();
    LocalDateTime getEndTime();
    Boolean getIsRead();
    LocalDateTime getCreatedTime();
}

