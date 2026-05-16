package com.example.backend.Payload.req;
import lombok.Data;
@Data
public class ProvinceCreateRequest {
    private String name;
    private String login;
    private String password;
    private String directorName;
    private String phoneNumber;
    private String location;
    private String description;
    private String businessSphere;
    private String passwordHint;
}
