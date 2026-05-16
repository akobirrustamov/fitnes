package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class RegionUpdateRequest {
    private String name;
    private String directorName;
    private String phoneNumber;
    private String location;
    private String description;
    private String businessSphere;
    private String passwordHint;
    private String photoUrl;
}

