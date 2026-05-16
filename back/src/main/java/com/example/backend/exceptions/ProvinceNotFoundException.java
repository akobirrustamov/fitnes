package com.example.backend.exceptions;

import lombok.Getter;

@Getter
public class ProvinceNotFoundException extends RuntimeException {
    private final String errorCode;

    public ProvinceNotFoundException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}

