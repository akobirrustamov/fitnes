package com.example.backend.exceptions;
public class OrganizationNotFoundException extends RuntimeException {
    private final String errorCode;
    public OrganizationNotFoundException(String errorCode, String message) { super(message); this.errorCode = errorCode; }
    public String getErrorCode() { return errorCode; }
}
