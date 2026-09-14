package com.aimentor.service;

import com.aimentor.exception.InvalidInputException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Sanitizes user input before it reaches the AI service.
 * Guards against XSS, SQL injection, and prompt injection attacks.
 */
@Service
@Slf4j
public class InputSanitizationService {

    @Value("${security.max-input-length:5000}")
    private int maxInputLength;

    // ── Threat patterns ───────────────────────────────────────────────────────

    private static final Pattern XSS = Pattern.compile(
        "<[^>]*script|javascript:|vbscript:|on\\w+\\s*=|<iframe|<object|<embed",
        Pattern.CASE_INSENSITIVE);

    private static final Pattern PROMPT_INJECTION = Pattern.compile(
        "(?i)(ignore (all |previous |above |prior )?(instructions?|prompts?|context)|" +
        "disregard|forget (all |the |your |previous )|" +
        "you are now|act as (if )?you|pretend (to be|you are)|" +
        "jailbreak|dan mode|developer mode|\\bDAN\\b|" +
        "system prompt|override (instructions?|rules?))",
        Pattern.CASE_INSENSITIVE);

    private static final Pattern DANGEROUS_CHARS = Pattern.compile(
        "[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]"); // control characters

    // ── Public API ────────────────────────────────────────────────────────────

    public String sanitizeTopic(String input) {
        if (input == null || input.isBlank()) {
            throw new InvalidInputException("Topic cannot be empty");
        }

        String trimmed = input.strip();

        // Length check
        if (trimmed.length() > maxInputLength) {
            throw new InvalidInputException(
                "Input exceeds maximum length of " + maxInputLength + " characters");
        }

        // Remove dangerous control characters
        trimmed = DANGEROUS_CHARS.matcher(trimmed).replaceAll("");

        // XSS check
        if (XSS.matcher(trimmed).find()) {
            log.warn("XSS attempt blocked in topic input");
            throw new InvalidInputException("Input contains disallowed HTML or script content");
        }

        // Prompt injection check
        if (PROMPT_INJECTION.matcher(trimmed).find()) {
            log.warn("Prompt injection attempt blocked: [{}]",
                trimmed.substring(0, Math.min(80, trimmed.length())));
            throw new InvalidInputException("Input contains disallowed content");
        }

        // Basic HTML entity encoding
        return htmlEncode(trimmed);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String htmlEncode(String input) {
        return input
            .replace("&",  "&amp;")
            .replace("<",  "&lt;")
            .replace(">",  "&gt;")
            .replace("\"", "&quot;")
            .replace("'",  "&#x27;");
    }
}
