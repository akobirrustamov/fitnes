package com.example.backend.exceptions;

public class CategoryNotFoundException extends RuntimeException {
    private final String errorCode;

    public CategoryNotFoundException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

