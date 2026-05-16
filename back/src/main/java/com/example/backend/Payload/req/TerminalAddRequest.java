package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class TerminalAddRequest {
    private String name;
    private String login;
    private String password;
    private String ip;
    private Boolean isComing;
    private String description;
    private String filter;
    private String model;
}

