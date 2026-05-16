package com.example.backend.exceptions;
public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException() {
        super("Refresh token yaroqsiz yoki muddati tugagan");
    }
}
