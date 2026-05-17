package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class TerminalUpdateRequest {
    private String name;
    private String description;
    private String filter;
    private Boolean isComing;
    private String ip;
    private String login;
    private String password;
    private String model;
}

