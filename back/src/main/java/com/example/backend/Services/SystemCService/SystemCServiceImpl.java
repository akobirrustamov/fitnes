package com.example.backend.Services.SystemCService;

import com.example.backend.Entity.Attachment;
import com.example.backend.Payload.res.UploadResponse;
import com.example.backend.Repository.AttachmentRepo;
import com.example.backend.exceptions.FileSizeExceededException;
import com.example.backend.exceptions.InvalidFileFormatException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemCServiceImpl implements SystemCService {

    private final AttachmentRepo attachmentRepo;

    @Value("${server.base-url:http://localhost:8080}")
    private String baseUrl;

    private static final long MAX_FILE_SIZE  = 200L * 1024; // 200 KB
    private static final int  THUMB_MAX_DIM  = 150;          // px
    private static final int  CACHE_MAX_SIZE = 100;

    /** URL → raw bytes in-memory cache */
    private final Map<String, byte[]> downloadCache = new ConcurrentHashMap<>();

    // ──────────────────────────────────────────────────────────
    //  POST /api/v1/systemC/upload
    // ──────────────────────────────────────────────────────────
    @Override
    public HttpEntity<?> upload(MultipartFile photo) throws IOException {

        // 1. Content-type
        String ct = photo.getContentType();
        if (ct == null || (!ct.equalsIgnoreCase("image/jpeg") && !ct.equalsIgnoreCase("image/jpg"))) {
            throw new InvalidFileFormatException();
        }

        // 2. Hajm
        if (photo.getSize() > MAX_FILE_SIZE) {
            throw new FileSizeExceededException();
        }

        // 3. JPEG magic bytes: FF D8 FF
        byte[] raw = photo.getBytes();
        if (raw.length < 3
                || (raw[0] & 0xFF) != 0xFF
                || (raw[1] & 0xFF) != 0xD8
                || (raw[2] & 0xFF) != 0xFF) {
            throw new InvalidFileFormatException();
        }

        // 4. Asl rasm saqlash
        String baseName = sanitize(photo.getOriginalFilename());
        UUID photoId = persist(raw, "photo_" + baseName, "/photo");

        // 5. Thumbnail
        byte[] thumb = buildThumbnail(raw);
        UUID thumbId = persist(thumb, "thumb_" + baseName, "/photo/thumb");

        String photoUrl = baseUrl + "/api/v1/file/img/" + photoId;
        String thumbUrl = baseUrl + "/api/v1/file/img/" + thumbId;

        log.info("Upload OK photoId={} thumbId={}", photoId, thumbId);
        return ResponseEntity.ok(new UploadResponse(photoUrl, thumbUrl));
    }

    // ──────────────────────────────────────────────────────────
    //  GET /api/v1/systemC/download?url=...
    // ──────────────────────────────────────────────────────────
    @Override
    public void download(String imageUrl, HttpServletResponse response) throws IOException {
        byte[] bytes;

        if (downloadCache.containsKey(imageUrl)) {
            bytes = downloadCache.get(imageUrl);
            log.debug("Cache hit: {}", imageUrl);
        } else {
            log.debug("Downloading: {}", imageUrl);
            try (InputStream in = new URL(imageUrl).openStream()) {
                bytes = in.readAllBytes();
            }
            if (downloadCache.size() >= CACHE_MAX_SIZE) {
                downloadCache.clear();
            }
            downloadCache.put(imageUrl, bytes);
        }

        response.setContentType(guessContentType(imageUrl));
        response.setContentLength(bytes.length);
        response.setHeader("Cache-Control", "public, max-age=86400");
        response.getOutputStream().write(bytes);
        response.getOutputStream().flush();
    }

    // ──────────────────────────────────────────────────────────
    //  GET /api/v1/systemC/healthStatus
    // ──────────────────────────────────────────────────────────
    @Override
    public HttpEntity<?> healthStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    // ──────────────────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────────────────

    private UUID persist(byte[] bytes, String fileName, String prefix) throws IOException {
        UUID id = UUID.randomUUID();
        String stored = id + "_" + fileName;
        File file = new File("backend/files" + prefix + "/" + stored);
        file.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(bytes);
        }
        attachmentRepo.save(new Attachment(id, prefix, stored));
        return id;
    }

    private byte[] buildThumbnail(byte[] raw) throws IOException {
        BufferedImage src = ImageIO.read(new ByteArrayInputStream(raw));
        if (src == null) throw new InvalidFileFormatException();

        double scale = Math.min(
                (double) THUMB_MAX_DIM / src.getWidth(),
                (double) THUMB_MAX_DIM / src.getHeight());
        int w = Math.max(1, (int) (src.getWidth()  * scale));
        int h = Math.max(1, (int) (src.getHeight() * scale));

        BufferedImage thumb = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = thumb.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING,     RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,  RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(thumb, "jpg", baos);
        return baos.toByteArray();
    }

    private String guessContentType(String url) {
        String u = url.toLowerCase();
        if (u.contains(".png"))  return "image/png";
        if (u.contains(".gif"))  return "image/gif";
        if (u.contains(".webp")) return "image/webp";
        if (u.contains(".bmp"))  return "image/bmp";
        return "image/jpeg";
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "image.jpg";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

