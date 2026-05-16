package com.example.backend.Payload.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Super Admin (ROLE_SUPERADMIN) foydalanuvchisi uchun profil response.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuperAdminProfileResponse {

    private Integer id;
    private String name;
    private String login;
    private String password;
    private LocalDateTime createdTime;
    private String passwordHint;
    private String photoUrl;
    private String directorName;
    private Boolean deleted;
    private String token;
    private String phoneNumber;
    private String businessSphere;
    private String location;
    private String description;
    private Integer roleId;
    private Boolean active;
    private LocalDateTime lastLogin;
}

