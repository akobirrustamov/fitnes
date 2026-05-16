package com.example.backend.exceptions;

public class MonitorNotFoundException extends RuntimeException {
    private final String errorCode;

    public MonitorNotFoundException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

