package com.example.backend.Controller;

import com.example.backend.Services.SystemCService.SystemCService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/systemC")
public class SystemCController {

    private final SystemCService systemCService;

    // ────────────────────────────────────────────────────────────
    //  POST /api/v1/systemC/upload
    //  Auth: [super_admin, director]
    //  Content-Type: multipart/form-data
    //  Param: photo — JPEG fayl (max 200KB)
    //
    //  200 → { url, thumbnailUrl }
    //  400 → { errorCode: "A0006", message }   (hajm oshib ketgan)
    //  415 → { errorCode: "A0007", message }   (JPEG emas)
    // ────────────────────────────────────────────────────────────
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HttpEntity<?> upload(@RequestParam("photo") MultipartFile photo) throws IOException {
        return systemCService.upload(photo);
    }

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/systemC/download?url=...
    //  Auth: [super_admin, director]
    //  Param: url — Rasm URL manzili
    //
    //  200 → Rasm binary (image/jpeg yoki boshqa)
    //  Keshda saqlanadi (in-memory, max 100 ta)
    // ────────────────────────────────────────────────────────────
    @GetMapping("/download")
    public void download(@RequestParam String url,
                         HttpServletResponse response) throws IOException {
        systemCService.download(url, response);
    }

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/systemC/healthStatus
    //  Auth: [super_admin, director]
    //  Header: token — JWT access token
    //
    //  200 → { status: "healthy", timestamp: "..." }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/healthStatus")
    public HttpEntity<?> healthStatus(@RequestHeader(value = "token", required = false) String token) {
        return systemCService.healthStatus();
    }
}

