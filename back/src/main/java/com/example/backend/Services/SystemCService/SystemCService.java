package com.example.backend.Services.SystemCService;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface SystemCService {

    /**
     * POST /api/v1/systemC/upload
     * JPEG rasm yuklaydi (max 200KB), thumbnail yaratadi va URLlarni qaytaradi.
     */
    HttpEntity<?> upload(MultipartFile photo) throws IOException;

    /**
     * GET /api/v1/systemC/download?url=...
     * Tashqi URL dan rasm yuklab oladi (keshga saqlaydi).
     */
    void download(String url, HttpServletResponse response) throws IOException;

    /**
     * GET /api/v1/systemC/healthStatus
     * Tizim holatini qaytaradi.
     */
    HttpEntity<?> healthStatus();
}

