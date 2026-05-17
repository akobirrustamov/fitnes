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

    @Column(name = "max_graphics_count", nullable = false)
    private Integer maxGraphicsCount;

    @Column(name = "max_terminals_count", nullable = false)
    private Integer maxTerminalsCount;
}

