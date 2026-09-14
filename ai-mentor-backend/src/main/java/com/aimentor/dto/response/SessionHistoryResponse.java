package com.aimentor.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionHistoryResponse {
    private Long          id;
    private String        topic;
    private String        sessionType;
    private String        skillLevel;
    private LocalDateTime createdAt;
    private long          durationMs;
    /**
     * Cloudinary URL of the full JSON result.
     * Included in the history list so the frontend can fetch content
     * directly from Cloudinary without a round-trip through the backend.
     */
    private String        cloudinaryUrl;
}
