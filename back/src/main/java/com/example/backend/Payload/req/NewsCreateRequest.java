package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class NewsCreateRequest {

    private String title;

    private String description;

    private String content;

    private String photoUrl;

    private String url;

}