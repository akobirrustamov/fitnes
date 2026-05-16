package com.example.backend.Payload.req;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationCreateRequest {
    private String name;
    private String login;
    private String directorName;
    private String phoneNumber;
    private Integer regionId;
    private String regionName;
    private Integer provinceId;
    private String businessSphere;
    private String location;
    private String passwordHint;
}

