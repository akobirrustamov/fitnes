package com.example.backend.exceptions;
public class InvalidSmsCodeException extends RuntimeException {
    public InvalidSmsCodeException() {
        super("SMS kod noto'g'ri");
    }
}
