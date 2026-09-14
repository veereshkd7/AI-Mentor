package com.aimentor.service;

import com.aimentor.dto.response.MentorResponse;
import com.aimentor.dto.response.SessionHistoryResponse;
import com.aimentor.entity.MentorSession;
import com.aimentor.entity.User;
import com.aimentor.repository.MentorSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final MentorSessionRepository  sessionRepo;
    private final CloudinaryStorageService cloudinaryStorage;

    // ── History list ──────────────────────────────────────────────────────────

    public List<SessionHistoryResponse> getUserHistory(User user) {
        return sessionRepo.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::toHistoryResponse)
            .toList();
    }

    // ── Single session (reload from Cloudinary) ───────────────────────────────

    /**
     * Load a past session for display.
     *
     * <p>Strategy:
     * <ol>
     *   <li>If a Cloudinary URL exists, fetch the <em>full</em> JSON from it.</li>
     *   <li>Fall back to the 500-char DB preview only if Cloudinary fetch fails.</li>
     * </ol>
     * This guarantees the user always sees the complete AI response when
     * they revisit a session from the history panel.
     */
    public MentorResponse getSession(Long id, User user) {
        MentorSession session = findOwnedSession(id, user);

        String content = session.getResponse(); // default: DB preview

        if (session.getCloudinaryUrl() != null) {
            String fetched = cloudinaryStorage.fetchContent(session.getCloudinaryUrl());
            if (fetched != null) {
                content = fetched;
                log.debug("Session {} content loaded from Cloudinary", id);
            } else {
                log.warn("Cloudinary fetch failed for session {} — serving DB preview", id);
            }
        }

        return MentorResponse.builder()
            .success(true)
            .sessionId(session.getId())
            .type(session.getSessionType().name())
            .topic(session.getTopic())
            .level(session.getSkillLevel())
            .content(content)
            .cloudinaryUrl(session.getCloudinaryUrl())
            .durationMs(session.getDurationMs() != null ? session.getDurationMs() : 0)
            .createdAt(session.getCreatedAt())
            .build();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteSession(Long id, User user) {
        MentorSession session = findOwnedSession(id, user);

        if (session.getCloudinaryUrl() != null && session.getSessionDate() != null) {
            cloudinaryStorage.deleteSessionResult(
                session.getId(),
                session.getUser().getUsername(),
                session.getSessionType().name(),
                session.getSessionDate()
            );
        }

        sessionRepo.delete(session);
        log.info("Deleted session {} for user {}", id, user.getUsername());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private MentorSession findOwnedSession(Long id, User user) {
        MentorSession session = sessionRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        if (!session.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return session;
    }

    private SessionHistoryResponse toHistoryResponse(MentorSession s) {
        return SessionHistoryResponse.builder()
            .id(s.getId())
            .topic(s.getTopic())
            .sessionType(s.getSessionType().name())
            .skillLevel(s.getSkillLevel())
            .createdAt(s.getCreatedAt())
            .durationMs(s.getDurationMs() != null ? s.getDurationMs() : 0)
            .cloudinaryUrl(s.getCloudinaryUrl())
            .build();
    }
}
