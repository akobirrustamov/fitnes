package com.example.backend.exceptions;

public class CategoryAlreadyExistsException extends RuntimeException {
    private final String errorCode;

    public CategoryAlreadyExistsException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

