package com.example.backend.exceptions;
public class DuplicateNameException extends RuntimeException {
    private final String errorCode;
    public DuplicateNameException(String errorCode, String message) { super(message); this.errorCode = errorCode; }
    public String getErrorCode() { return errorCode; }
}
