package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "api_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "opening_time")
    private String openingTime;

    @Column(name = "closing_time")
    private String closingTime;

    @Column(name = "max_users_count")
    private Integer maxUsersCount;

    @Column(name = "max_terminals_count")
    private Integer maxTerminalsCount;

    @Column(name = "max_graphics_count")
    private Integer maxGraphicsCount;

    @Column(name = "price_per_user")
    private Long pricePerUser;
}

