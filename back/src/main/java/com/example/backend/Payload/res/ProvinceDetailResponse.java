package com.example.backend.Payload.res;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ProvinceDetailResponse {
    private Integer id;
    private String name;
    private String login;
    private String directorName;
    private String phoneNumber;
    private String location;
    private String description;
    private String businessSphere;
    private String photoUrl;
    private String passwordHint;
    private boolean active;
    private boolean deleted;
    private Integer roleId;
    private LocalDateTime createdTime;
    private LocalDateTime lastLogin;
}

