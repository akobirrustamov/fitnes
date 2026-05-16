package com.example.backend.exceptions;

public class LoginBlockedException extends RuntimeException {

    private final long remainingMinutes;

    public LoginBlockedException(long remainingMinutes) {
        super("Login bloklangan. Yana " + remainingMinutes + " daqiqadan so'ng urinib ko'ring.");
        this.remainingMinutes = remainingMinutes;
    }

    public long getRemainingMinutes() {
        return remainingMinutes;
    }
}

