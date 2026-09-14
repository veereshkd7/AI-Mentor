package com.aimentor.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MentorResponse {
    private boolean       success;
    private Long          sessionId;
    private String        type;
    private String        topic;
    private String        level;
    /** Raw JSON string returned by the AI model. */
    private String        content;
    /**
     * Secure Cloudinary URL where the full JSON result is permanently stored.
     * May be null if the Cloudinary upload failed (content is still returned inline).
     */
    private String        cloudinaryUrl;
    private long          durationMs;
    private LocalDateTime createdAt;
}
