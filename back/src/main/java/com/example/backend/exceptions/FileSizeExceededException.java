package com.example.backend.exceptions;
public class FileSizeExceededException extends RuntimeException {
    public FileSizeExceededException() { super("Fayl hajmi 200KB dan oshmasligi kerak"); }
}
