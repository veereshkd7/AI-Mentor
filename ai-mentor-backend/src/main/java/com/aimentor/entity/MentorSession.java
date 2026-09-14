package com.aimentor.entity;

import com.aimentor.entity.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mentor_sessions",
    indexes = {
        @Index(name = "idx_session_user_id",    columnList = "user_id"),
        @Index(name = "idx_session_created_at", columnList = "created_at"),
        @Index(name = "idx_session_session_date", columnList = "session_date")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MentorSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 300)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 20)
    private SessionType sessionType;

    @Column(name = "skill_level", length = 20)
    private String skillLevel;

    @Column(name = "question_count")
    private Integer questionCount;

    /**
     * Short 500-char preview in PostgreSQL (for quick list rendering).
     * The <em>full</em> AI JSON lives in Cloudinary at {@link #cloudinaryUrl}.
     */
    @Column(columnDefinition = "TEXT")
    private String response;

    /**
     * Secure Cloudinary URL for the full JSON result.
     * Path: {@code ai-mentor/sessions/{username}/{yyyy-MM-dd}/{type}/{id}.json}
     */
    @Column(name = "cloudinary_url", length = 1000)
    private String cloudinaryUrl;

    /**
     * Calendar date of the session — stored separately so Cloudinary paths
     * can be reconstructed without parsing {@code createdAt}.
     */
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt   = LocalDateTime.now();
        sessionDate = createdAt.toLocalDate();
    }
}
