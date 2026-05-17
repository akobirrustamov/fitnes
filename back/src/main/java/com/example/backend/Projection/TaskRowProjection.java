package com.example.backend.Projection;

import java.time.LocalDateTime;

public interface TaskRowProjection {
    Long getId();
    Long getTerminalId();
    String getTerminalName();
    Long getPersonId();
    String getPersonName();
    String getAction();
    String getStatus();
    LocalDateTime getCreatedTime();
}

