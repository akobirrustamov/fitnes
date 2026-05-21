package com.example.backend.Payload.req;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NewsCreateRequest {

    private String title;

    private String description;

    private String content;

    private String photoUrl;

    private String url;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

}