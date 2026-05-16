package com.example.backend.Payload.req;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequest {
    private String password;
}
