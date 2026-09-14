package com.aimentor.service;

import com.aimentor.config.CloudinaryProperties;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Stores AI-generated session results in Cloudinary as raw JSON files.
 *
 * <p><b>Path pattern</b> (human-readable, login-stable):
 * <pre>
 *   ai-mentor/sessions/{username}/{yyyy-MM-dd}/{sessionType}/{sessionId}.json
 * </pre>
 * e.g.  {@code ai-mentor/sessions/veeresh/2026-08-26/roadmap/42.json}
 *
 * <p>Using {@code username} instead of a numeric userId means every file can
 * be found immediately just by knowing who generated it and when — no DB
 * look-up required to browse or reconstruct history.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryStorageService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final Cloudinary           cloudinary;
    private final CloudinaryProperties props;

    // ── Upload ────────────────────────────────────────────────────────────────

    /**
     * Upload the full AI JSON result to Cloudinary.
     *
     * @param sessionId   DB row id — used to make the filename unique
     * @param username    owner's login name — top-level namespace
     * @param sessionType e.g. "ROADMAP", "QUIZ"
     * @param date        date of the session — second namespace level
     * @param jsonContent complete JSON string from the AI
     * @return secure HTTPS URL, or {@code null} on failure (caller handles gracefully)
     */
    public String uploadSessionResult(Long sessionId, String username,
                                      String sessionType, LocalDate date,
                                      String jsonContent) {
        try {
            byte[] bytes    = jsonContent.getBytes(StandardCharsets.UTF_8);
            String publicId = buildPublicId(username, sessionType, date, sessionId);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                bytes,
                ObjectUtils.asMap(
                    "resource_type", "raw",
                    "public_id",     publicId,
                    "overwrite",     true,
                    "format",        "json",
                    "tags",          new String[]{"ai-mentor", username, sessionType.toLowerCase()}
                )
            );

            String url = (String) result.get("secure_url");
            log.info("Uploaded session {} ({}) for {} → {}", sessionId, sessionType, username, url);
            return url;

        } catch (Exception e) {
            log.error("Cloudinary upload failed for session {}: {}", sessionId, e.getMessage(), e);
            return null;
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /**
     * Remove a session result from Cloudinary when the session row is deleted.
     */
    public void deleteSessionResult(Long sessionId, String username,
                                    String sessionType, LocalDate date) {
        try {
            String publicId = buildPublicId(username, sessionType, date, sessionId);
            cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.asMap("resource_type", "raw")
            );
            log.info("Deleted Cloudinary asset for session {}", sessionId);
        } catch (Exception e) {
            log.warn("Could not delete Cloudinary asset for session {}: {}", sessionId, e.getMessage());
        }
    }

    // ── Fetch full content ────────────────────────────────────────────────────

    /**
     * Fetch the full JSON content string from a Cloudinary secure URL.
     * Used by {@code SessionService.getSession()} so the history reload
     * returns the complete AI response, not just the 500-char DB preview.
     *
     * @return raw JSON string, or {@code null} on failure
     */
    public String fetchContent(String secureUrl) {
        try {
            java.net.URL url = new java.net.URI(secureUrl).toURL();
            try (java.io.InputStream in = url.openStream()) {
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.error("Failed to fetch content from Cloudinary URL {}: {}", secureUrl, e.getMessage());
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Builds the Cloudinary public_id.
     * Pattern: {@code <folder>/<username>/<yyyy-MM-dd>/<sessionType>/<sessionId>}
     */
    public String buildPublicId(String username, String sessionType,
                                 LocalDate date, Long sessionId) {
        return "%s/%s/%s/%s/%d".formatted(
            props.getFolder(),
            sanitize(username),
            date.format(DATE_FMT),
            sessionType.toLowerCase(),
            sessionId
        );
    }

    /** Strip characters that are illegal in a Cloudinary public_id. */
    private String sanitize(String s) {
        return s.replaceAll("[^a-zA-Z0-9_\\-]", "_").toLowerCase();
    }
}
