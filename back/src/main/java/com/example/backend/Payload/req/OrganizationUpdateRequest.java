package com.example.backend.Payload.req;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationUpdateRequest {
    private String name;
    private String directorName;
    private String phoneNumber;
    private String businessSphere;
    private String location;
    private String passwordHint;
    private Integer regionId;
    private String regionName;
    private Integer provinceId;
    private String photoUrl;
    private String sourcePath;
    private String adminName;
    private String adminPhoneNumber;
    private Integer sendTurn;
    private Integer monitorId;
}

