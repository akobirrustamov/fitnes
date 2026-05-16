package com.example.backend.exceptions;

public class CategoryValidationException extends RuntimeException {
    private final String errorCode;

    public CategoryValidationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

