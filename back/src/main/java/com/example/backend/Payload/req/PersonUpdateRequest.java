package com.example.backend.Payload.req;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PersonUpdateRequest {
    private String fullname;
    private String phoneNumber;
    private String gender;
    private LocalDate birthDate;
    private String location;
    private Integer graphicId;
    private Boolean active;
}

