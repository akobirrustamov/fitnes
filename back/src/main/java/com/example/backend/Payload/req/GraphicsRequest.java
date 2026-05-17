package com.example.backend.Payload.req;

import lombok.Data;

@Data
public class GraphicsRequest {
    private String name;
    private String description;
    private Boolean isMonday;
    private Boolean isTuesday;
    private Boolean isWednesday;
    private Boolean isThursday;
    private Boolean isFriday;
    private Boolean isSaturday;
    private Boolean isSunday;
}

