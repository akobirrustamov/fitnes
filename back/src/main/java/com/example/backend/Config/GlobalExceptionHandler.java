package com.example.backend.Config;

import com.example.backend.Payload.res.ErrorResponse;
import com.example.backend.exceptions.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Auth xatolari ────────────────────────────────────────────

    /** A0001 – Login yoki parol noto'g'ri */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        log.warn("Auth: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("A0001", "Login yoki parol noto'g'ri"));
    }

    /** A0002 – Login bloklangan */
    @ExceptionHandler(LoginBlockedException.class)
    public ResponseEntity<ErrorResponse> handleLoginBlocked(LoginBlockedException ex) {
        log.warn("Blok: {} daqiqa qoldi", ex.getRemainingMinutes());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("A0002",
                        "Login bloklangan. Yana " + ex.getRemainingMinutes() + " daqiqadan so'ng urinib ko'ring."));
    }

    /** A0003 – Refresh token yaroqsiz */
    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        log.warn("Refresh token: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("A0003", "Refresh token yaroqsiz yoki muddati tugagan"));
    }

    /** A0004 – Login topilmadi */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        log.warn("User not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("A0004", ex.getMessage()));
    }

    /** A0005 – SMS kod noto'g'ri */
    @ExceptionHandler(InvalidSmsCodeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSmsCode(InvalidSmsCodeException ex) {
        log.warn("SMS kod: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("A0005", "SMS kod noto'g'ri"));
    }

    // ── SystemC xatolari ─────────────────────────────────────────

    /** A0006 – Fayl hajmi 200KB dan oshib ketdi */
    @ExceptionHandler(FileSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleFileSizeExceeded(FileSizeExceededException ex) {
        log.warn("File size exceeded: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("A0006", "Fayl hajmi 200KB dan oshmasligi kerak"));
    }

    /** A0007 – Faqat JPEG formatdagi rasmlar qabul qilinadi */
    @ExceptionHandler(InvalidFileFormatException.class)
    public ResponseEntity<ErrorResponse> handleInvalidFileFormat(InvalidFileFormatException ex) {
        log.warn("Invalid file format: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ErrorResponse("A0007", "Faqat JPEG formatdagi rasmlar qabul qilinadi"));
    }

    // ── Category xatolari ────────────────────────────────────────

    /** A0008, A0011, A0012 – Kategoriya topilmadi */
    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCategoryNotFound(CategoryNotFoundException ex) {
        log.warn("Category not found [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    /** A0009, A0014 – Validatsiya xatosi (kategoriya va tashkilot uchun) */
    @ExceptionHandler(CategoryValidationException.class)
    public ResponseEntity<ErrorResponse> handleCategoryValidation(CategoryValidationException ex) {
        log.warn("Validation [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    /** A0010 – Kategoriya nomi takrorlangan */
    @ExceptionHandler(CategoryAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleCategoryAlreadyExists(CategoryAlreadyExistsException ex) {
        log.warn("Category already exists [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    // ── Organization / Validation xatolari ───────────────────────
    // A0013-A0017: OrganizationNotFoundException (NOT_FOUND) qayta ishlatiladi

    // ── Profile xatolari ─────────────────────────────────────────

    /** A0018-A0025 – Monitor topilmadi */
    @ExceptionHandler(MonitorNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleMonitorNotFound(MonitorNotFoundException ex) {
        log.warn("Monitor not found [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    /** A0075, A0086, A0095 – Tashkilot topilmadi / o'chirilgan */
    @ExceptionHandler(OrganizationNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleOrgNotFound(OrganizationNotFoundException ex) {
        log.warn("Org not found [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    /** A0087 – Tashkilot nomi allaqachon mavjud */
    @ExceptionHandler(DuplicateNameException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateName(DuplicateNameException ex) {
        log.warn("Duplicate name [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    /** A0020, A0015 (region context) – Tuman topilmadi */
    @ExceptionHandler(RegionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleRegionNotFound(RegionNotFoundException ex) {
        log.warn("Region not found [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    // ── Mavjud xatolari ──────────────────────────────────────────

    @ExceptionHandler(StudentNotFoundException.class)
    public ResponseEntity<?> handleStudentNotFound(StudentNotFoundException ex) {
        log.error("Student not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidStudentDataException.class)
    public ResponseEntity<?> handleInvalidStudentData(InvalidStudentDataException ex) {
        log.warn("Invalid student data: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationError(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.warn("Validation error: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("VALIDATION_ERROR", "Invalid input data", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }

    private Map<String, Object> buildErrorResponse(String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", error);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    private Map<String, Object> buildErrorResponse(String error, String message, Map<String, String> details) {
        Map<String, Object> response = buildErrorResponse(error, message);
        response.put("details", details);
        return response;
    }
}

