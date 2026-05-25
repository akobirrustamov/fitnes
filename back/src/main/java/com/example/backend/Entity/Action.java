package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "actions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Action {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "person_id")
    private Integer personId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "incoming_time")
    private LocalDateTime incomingTime;

    @Column(name = "outgoing_time")
    private LocalDateTime outgoingTime;

    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "today_is_important")
    private Boolean todayIsImportant;

    @Column(nullable = false)
    private LocalDate date;

    private LocalDateTime datetime;

    @Column(name = "s_days", nullable = false)
    private Integer sDays;
}
