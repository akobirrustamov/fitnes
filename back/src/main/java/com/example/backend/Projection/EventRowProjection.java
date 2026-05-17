package com.example.backend.Projection;

import java.time.LocalDateTime;

public interface EventRowProjection {
    Long getId();
    Long getPersonId();
    String getPersonName();
    String getPersonPhoto();
    Long getTerminalId();
    String getTerminalName();
    String getDirection();
    LocalDateTime getDatetime();
}

