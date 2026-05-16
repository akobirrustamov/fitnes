package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class MonitorCreateRequest {
    private String name;
    private String login;
    private String password;
    private String phoneNumber;
    private String description;
    private String passwordHint;
}

