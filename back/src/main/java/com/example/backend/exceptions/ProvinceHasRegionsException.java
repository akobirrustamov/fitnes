package com.example.backend.exceptions;
import lombok.Getter;
@Getter
public class ProvinceHasRegionsException extends RuntimeException {
    private final String errorCode;
    public ProvinceHasRegionsException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
