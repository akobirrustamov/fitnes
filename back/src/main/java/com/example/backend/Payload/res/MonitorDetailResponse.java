package com.example.backend.Payload.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MonitorDetailResponse {
    private Integer id;
    private String name;
    private String login;
    private String phoneNumber;
    private String description;
    private String photoUrl;
    private String passwordHint;
    private Boolean active;
    private Boolean deleted;
    private Integer roleId;
    private LocalDateTime createdTime;
    private LocalDateTime lastLogin;
}

