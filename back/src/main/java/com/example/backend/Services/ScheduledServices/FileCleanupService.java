package com.example.backend.Services.ScheduledServices;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * FileCleanupService – har 24 soatda (00:00) eski fayllarni o'chiradi
 */
@Service
@Slf4j
public class FileCleanupService {

    @Value("${file.upload-dir:backend/files}")
    private String uploadDir;

    // Maksimal yosh (kunlarda)
    private static final int REGULAR_MAX_DAYS   = 30;
    private static final int TEMP_MAX_DAYS      = 1;
    private static final int EXCEL_MAX_DAYS     = 7;
    private static final int LOG_MAX_DAYS       = 90;

    /**
     * Har kuni soat 00:00 da ishga tushadi
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void cleanupOldFiles() {
        log.info("🧹 FileCleanupService ishga tushdi...");

        long deleted = 0;
        AtomicLong freedBytes = new AtomicLong(0);

        try {
            Path root = Paths.get(uploadDir);
            if (!Files.exists(root)) {
                log.warn("Upload papkasi topilmadi: {}", uploadDir);
                return;
            }

            deleted += deleteOldFiles(root, "temp_",    TEMP_MAX_DAYS,    freedBytes);
            deleted += deleteOldFiles(root, ".xlsx",    EXCEL_MAX_DAYS,   freedBytes);
            deleted += deleteOldFiles(root, ".log",     LOG_MAX_DAYS,     freedBytes);
            deleted += deleteOldRegularFiles(root,      REGULAR_MAX_DAYS, freedBytes);

        } catch (IOException e) {
            log.error("❌ FileCleanupService xatosi: {}", e.getMessage(), e);
        }

        double freedMb = freedBytes.get() / (1024.0 * 1024.0);
        log.info("✅ FileCleanupService tugadi. O'chirildi: {} fayl, Bo'shatildi: {:.2f} MB",
                deleted, freedMb);
    }

    /** temp_* fayllarni yoki muddati bo'yicha o'chirish */
    private long deleteOldFiles(Path root, String suffix, int maxDays, AtomicLong freed)
            throws IOException {

        if (!Files.exists(root)) return 0;

        long count = 0;
        Instant cutoff = Instant.now().minus(maxDays, ChronoUnit.DAYS);

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(root)) {
            for (Path path : stream) {
                if (Files.isRegularFile(path)) {
                    String name = path.getFileName().toString();
                    boolean matches = suffix.startsWith(".")
                            ? name.endsWith(suffix)
                            : name.startsWith(suffix);

                    if (matches) {
                        BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
                        if (attrs.creationTime().toInstant().isBefore(cutoff)) {
                            freed.addAndGet(attrs.size());
                            Files.deleteIfExists(path);
                            count++;
                            log.debug("🗑  Deleted: {}", path.getFileName());
                        }
                    }
                }
            }
        }
        return count;
    }

    /** 30 kundan eski barcha odatiy fayllarni o'chirish (temp/excel/log hisob-kitob qilinmagan) */
    private long deleteOldRegularFiles(Path root, int maxDays, AtomicLong freed)
            throws IOException {

        if (!Files.exists(root)) return 0;

        long count = 0;
        Instant cutoff = Instant.now().minus(maxDays, ChronoUnit.DAYS);

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(root)) {
            for (Path path : stream) {
                if (Files.isRegularFile(path)) {
                    String name = path.getFileName().toString();
                    // temp/xlsx/log fayllar yuqorida hisoblab o'tilgan
                    if (name.startsWith("temp_") || name.endsWith(".xlsx") || name.endsWith(".log")) {
                        continue;
                    }
                    BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
                    if (attrs.creationTime().toInstant().isBefore(cutoff)) {
                        freed.addAndGet(attrs.size());
                        Files.deleteIfExists(path);
                        count++;
                        log.debug("🗑  Deleted old file: {}", path.getFileName());
                    }
                }
            }
        }
        return count;
    }
}

