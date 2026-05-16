package com.example.backend.Payload.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GetAll ro'yxatidagi har bir tashkilot uchun qisqa ma'lumot.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrganizationListItem {
    private Integer id;
    private String name;
    private String directorName;
    private String login;
    private String phoneNumber;
    private String businessSphere;
    private Integer regionId;
    private String regionName;
    private Integer monitorId;
    private Boolean active;
    private BigDecimal balance;
    private LocalDateTime createdTime;
    private LocalDateTime lastLogin;
}

