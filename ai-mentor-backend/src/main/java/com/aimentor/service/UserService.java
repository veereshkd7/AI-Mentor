package com.aimentor.service;

import com.aimentor.dto.request.UpdateProfileRequest;
import com.aimentor.dto.response.ProfileResponse;
import com.aimentor.entity.MentorSession;
import com.aimentor.entity.User;
import com.aimentor.repository.MentorSessionRepository;
import com.aimentor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository           userRepository;
    private final MentorSessionRepository  sessionRepository;
    private final CloudinaryStorageService cloudinaryStorage;
    private final PasswordEncoder          passwordEncoder;
    private final AuditService             auditService;

    // ── Get profile ───────────────────────────────────────────────────────────

    public ProfileResponse getProfile(User user) {
        long sessionCount = sessionRepository.countByUser(user);
        return ProfileResponse.builder()
            .username(user.getUsername())
            .email(user.getEmail())
            .createdAt(user.getCreatedAt())
            .lastLogin(user.getLastLogin())
            .totalSessions(sessionCount)
            .build();
    }

    // ── Update profile ────────────────────────────────────────────────────────

    @Transactional
    public ProfileResponse updateProfile(User user, UpdateProfileRequest req) {

        // Always require current password to authorise the change
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Current password is incorrect");
        }

        boolean changed = false;

        // Update email if provided and different
        if (req.getEmail() != null && !req.getEmail().isBlank()
                && !req.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email address is already in use");
            }
            user.setEmail(req.getEmail());
            changed = true;
        }

        // Update password if a new one was supplied
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getNewPassword().length() < 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
            // Invalidate refresh token so all sessions must re-authenticate
            user.setRefreshTokenHash(null);
            changed = true;
        }

        if (!changed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No changes provided");
        }

        userRepository.save(user);
        auditService.log(user.getUsername(), "PROFILE_UPDATE", "/api/v1/user/profile",
            null, null, "SUCCESS", "Profile updated");
        log.info("Profile updated for user={}", user.getUsername());

        return ProfileResponse.builder()
            .username(user.getUsername())
            .email(user.getEmail())
            .createdAt(user.getCreatedAt())
            .lastLogin(user.getLastLogin())
            .totalSessions(sessionRepository.countByUser(user))
            .message("Profile updated successfully")
            .build();
    }

    // ── Delete account ────────────────────────────────────────────────────────

    @Transactional
    public void deleteAccount(User user, String currentPassword) {

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Password is incorrect");
        }

        // 1. Delete all session files from Cloudinary before removing DB rows
        List<MentorSession> sessions = sessionRepository.findByUserOrderByCreatedAtDesc(user);
        for (MentorSession s : sessions) {
            if (s.getCloudinaryUrl() != null && s.getSessionDate() != null) {
                cloudinaryStorage.deleteSessionResult(
                    s.getId(), user.getUsername(),
                    s.getSessionType().name(), s.getSessionDate()
                );
            }
        }

        // 2. Delete the user — cascades to sessions and roles via @OneToMany
        auditService.log(user.getUsername(), "ACCOUNT_DELETE", "/api/v1/user/account",
            null, null, "SUCCESS",
            "Account deleted — " + sessions.size() + " sessions cleaned up");
        log.info("Account deleted for user={} ({} sessions)", user.getUsername(), sessions.size());

        userRepository.delete(user);
    }
}
