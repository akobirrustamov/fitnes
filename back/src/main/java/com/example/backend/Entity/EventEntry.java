package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    @Column(name = "person_id", nullable = false)
    private Long personId;

    @Column(name = "terminal_id")
    private Long terminalId;

    @Column(nullable = false)
    private String direction;

    @Column(name = "entry_time", nullable = false)
    private LocalDateTime entryTime;
}

