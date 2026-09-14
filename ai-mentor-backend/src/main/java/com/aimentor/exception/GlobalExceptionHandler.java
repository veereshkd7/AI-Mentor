package com.aimentor.exception;

import com.aimentor.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── 400: Validation ───────────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field   = ((FieldError) err).getField();
            String message = err.getDefaultMessage();
            fieldErrors.put(field, message);
        });

        return ResponseEntity.badRequest().body(ApiErrorResponse.builder()
            .success(false)
            .error("VALIDATION_FAILED")
            .message("Request validation failed")
            .fieldErrors(fieldErrors)
            .timestamp(LocalDateTime.now())
            .path(req.getRequestURI())
            .build());
    }

    // ── 400: Invalid input ────────────────────────────────────────────────────
    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidInput(
            InvalidInputException ex, HttpServletRequest req) {
        return badRequest("INVALID_INPUT", ex.getMessage(), req);
    }

    // ── 401: Bad credentials ──────────────────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest req) {
        return status(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
            "Invalid username or password", req);
    }

    // ── 423: Account locked ───────────────────────────────────────────────────
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiErrorResponse> handleLocked(
            AccountLockedException ex, HttpServletRequest req) {
        return status(HttpStatus.LOCKED, "ACCOUNT_LOCKED", ex.getMessage(), req);
    }

    // ── 409: Duplicate user ───────────────────────────────────────────────────
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(
            UserAlreadyExistsException ex, HttpServletRequest req) {
        return status(HttpStatus.CONFLICT, "USER_EXISTS", ex.getMessage(), req);
    }

    // ── 403: Access denied ────────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest req) {
        return status(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied", req);
    }

    // ── 503: AI service error ─────────────────────────────────────────────────
    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleAiService(
            AiServiceException ex, HttpServletRequest req) {
        log.error("AI service error: {}", ex.getMessage());
        return status(HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_ERROR",
            "AI service temporarily unavailable. Please try again.", req);
    }

    // ── 500: Unhandled ────────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        return status(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
            "An unexpected error occurred", req);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private ResponseEntity<ApiErrorResponse> badRequest(String error, String message,
                                                        HttpServletRequest req) {
        return status(HttpStatus.BAD_REQUEST, error, message, req);
    }

    private ResponseEntity<ApiErrorResponse> status(HttpStatus httpStatus, String error,
                                                    String message, HttpServletRequest req) {
        return ResponseEntity.status(httpStatus).body(ApiErrorResponse.builder()
            .success(false)
            .error(error)
            .message(message)
            .timestamp(LocalDateTime.now())
            .path(req.getRequestURI())
            .build());
    }
}
