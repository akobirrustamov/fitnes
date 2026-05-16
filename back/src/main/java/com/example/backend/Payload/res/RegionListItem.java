package com.example.backend.Payload.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RegionListItem {
    private Integer id;
    private String name;
    private String login;
    private String directorName;
    private String phoneNumber;
    private Integer provinceId;
    private String provinceName;
    private boolean active;
    private LocalDateTime createdTime;
    private LocalDateTime lastLogin;
}

