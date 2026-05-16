package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class RegionCreateRequest {
    private String name;
    private String login;
    private String password;
    private Integer provinceId;
    private String provinceName;
    private String directorName;
    private String phoneNumber;
    private String location;
    private String description;
    private String businessSphere;
    private String passwordHint;
}

