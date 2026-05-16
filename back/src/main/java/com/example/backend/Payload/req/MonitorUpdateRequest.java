package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class MonitorUpdateRequest {
    private String name;
    private String description;
    private String phoneNumber;
    private String photoUrl;
}

