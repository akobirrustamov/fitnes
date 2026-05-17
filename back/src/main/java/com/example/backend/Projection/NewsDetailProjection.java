package com.example.backend.Projection;

public interface NewsDetailProjection {
    Long getNewsId();
    String getTitle();
    String getDescription();
    String getContent();
    String getPhotoUrl();
    String getUrl();
    Boolean getIsRead();
}

