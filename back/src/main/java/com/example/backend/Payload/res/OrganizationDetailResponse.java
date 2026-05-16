package com.example.backend.Payload.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GetById to'liq tashkilot ma'lumotlari.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrganizationDetailResponse {
    private Integer id;
    private String name;
    private String licenseKey;
    private String productKey;
    private LocalDateTime createdTime;
    private String directorName;
    private String login;
    private String passwordHint;
    private Boolean active;
    private Boolean deleted;
    private String sourcePath;
    private Boolean telegramBotActive;
    private String phoneNumber;
    private String businessSphere;
    private BigDecimal balance;
    private Boolean updated;
    private Integer roleId;
    private Integer sendTurn;
    private String photoUrl;
    private LocalDateTime lastLogin;
    private Integer regionId;
    private String regionName;
    private String location;
    private String adminName;
    private String adminPhoneNumber;
    private Integer monitorId;
}

