package com.example.backend.exceptions;

import lombok.Getter;

@Getter
public class RegionNotFoundException extends RuntimeException {
    private final String errorCode;

    public RegionNotFoundException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}

