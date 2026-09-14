package com.aimentor.service;

import com.aimentor.config.JwtProperties;
import com.aimentor.dto.request.LoginRequest;
import com.aimentor.dto.request.RegisterRequest;
import com.aimentor.dto.response.AuthResponse;
import com.aimentor.dto.response.TokenStatusResponse;
import com.aimentor.entity.User;
import com.aimentor.exception.AccountLockedException;
import com.aimentor.exception.UserAlreadyExistsException;
import com.aimentor.repository.UserRepository;
import com.aimentor.util.JwtUtil;
import com.aimentor.util.TokenHashUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtil               jwtUtil;
    private final JwtProperties         jwtProps;
    private final AuditService          auditService;

    @Value("${security.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.lockout-duration-minutes:30}")
    private int lockoutMinutes;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req, String ip) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new UserAlreadyExistsException("Email address already registered");
        }

        User user = User.builder()
            .username(req.getUsername())
            .email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .roles(Set.of("ROLE_USER"))
            .enabled(true)
            .accountLocked(false)
            .build();

        userRepository.save(user);
        auditService.log(req.getUsername(), "REGISTER", "/api/v1/auth/register",
            ip, null, "SUCCESS", "New user registered");
        log.info("New user registered: {}", req.getUsername());

        return issueTokens(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req, String ip, String userAgent) {
        User user = userRepository.findByUsername(req.getUsername()).orElse(null);

        if (user == null) {
            auditService.log(req.getUsername(), "LOGIN_FAILED", "/api/v1/auth/login",
                ip, userAgent, "FAILED", "Unknown username");
            throw new BadCredentialsException("Invalid credentials");
        }

        if (user.isAccountLocked()) {
            LocalDateTime unlockAt = user.getLockTime().plusMinutes(lockoutMinutes);
            if (LocalDateTime.now().isBefore(unlockAt)) {
                auditService.log(user.getUsername(), "LOGIN_BLOCKED", "/api/v1/auth/login",
                    ip, userAgent, "BLOCKED", "Account locked");
                throw new AccountLockedException(
                    "Account locked due to too many failed attempts. " +
                    "Try again after " + lockoutMinutes + " minutes.");
            }
            // Auto-unlock
            user.setAccountLocked(false);
            user.setFailedLoginAttempts(0);
        }

        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        } catch (AuthenticationException e) {
            handleFailedAttempt(user, ip, userAgent);
            throw new BadCredentialsException("Invalid credentials");
        }

        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        user.setLastLogin(LocalDateTime.now());

        AuthResponse response = issueTokens(user);
        user.setRefreshTokenHash(TokenHashUtil.sha256(response.getRefreshToken()));
        userRepository.save(user);

        auditService.log(user.getUsername(), "LOGIN", "/api/v1/auth/login",
            ip, userAgent, "SUCCESS", "Login successful");
        log.info("User logged in: {} from {}", user.getUsername(), ip);

        return response;
    }

    // ── Silent Refresh ────────────────────────────────────────────────────────
    /**
     * Silently rotate the access token using a still-valid refresh token.
     * The session stays alive without any user interaction.
     * A new refresh token is also issued (refresh token rotation).
     */
    @Transactional
    public AuthResponse silentRefresh(String refreshToken) {
        if (!jwtUtil.isRefreshTokenValid(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String username = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (user.getRefreshTokenHash() == null
                || TokenHashUtil.sha256(refreshToken)
                .equals(user.getRefreshTokenHash())) {
            // Refresh token was already rotated or invalidated — force re-login
            throw new BadCredentialsException("Refresh token has been superseded. Please log in again.");
        }

        AuthResponse response = issueTokens(user);
        user.setRefreshTokenHash(TokenHashUtil.sha256(response.getRefreshToken()));
        userRepository.save(user);

        auditService.log(username, "SILENT_REFRESH", "/api/v1/auth/silent-refresh",
            null, null, "SUCCESS", "Access token silently refreshed");
        log.info("Silent refresh for user={}", username);

        return response;
    }

    // ── Manual Refresh (kept for backward compat) ─────────────────────────────

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        return silentRefresh(refreshToken);
    }

    // ── Token Status ──────────────────────────────────────────────────────────
    /**
     * Returns how much time is left on the caller's current access token,
     * including whether they've entered the warning window.
     */
    public TokenStatusResponse tokenStatus(String accessToken) {
        long secondsRemaining     = jwtUtil.secondsUntilExpiry(accessToken);
        long expiresAt            = jwtUtil.extractExpirationEpochSecond(accessToken);
        long warningThreshold     = jwtProps.getWarningThresholdSeconds();
        boolean warn              = secondsRemaining <= warningThreshold;
        boolean urgent            = secondsRemaining <= (warningThreshold / 2);

        return TokenStatusResponse.builder()
            .tokenExpiresAt(expiresAt)
            .secondsRemaining(secondsRemaining)
            .warn(warn)
            .urgent(urgent)
            .warningThresholdSeconds(warningThreshold)
            .build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setRefreshTokenHash(null);
            userRepository.save(user);
        });
        auditService.log(username, "LOGOUT", "/api/v1/auth/logout",
            null, null, "SUCCESS", "User logged out");
        log.info("User logged out: {}", username);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse issueTokens(User user) {
        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        return AuthResponse.builder()
            .success(true)
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtProps.getAccessTokenExpiryMs() / 1000)
            .tokenExpiresAt(jwtUtil.extractExpirationEpochSecond(accessToken))
            .warningThresholdSeconds(jwtProps.getWarningThresholdSeconds())
            .username(user.getUsername())
            .email(user.getEmail())
            .roles(user.getRoles())
            .build();
    }

    private void handleFailedAttempt(User user, String ip, String userAgent) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= maxFailedAttempts) {
            user.setAccountLocked(true);
            user.setLockTime(LocalDateTime.now());
            log.warn("Account locked after {} failed attempts: {}", attempts, user.getUsername());
            auditService.log(user.getUsername(), "ACCOUNT_LOCKED", "/api/v1/auth/login",
                ip, userAgent, "SECURITY",
                "Locked after " + attempts + " failed login attempts");
        } else {
            auditService.log(user.getUsername(), "LOGIN_FAILED", "/api/v1/auth/login",
                ip, userAgent, "FAILED",
                "Failed attempt " + attempts + "/" + maxFailedAttempts);
        }
        userRepository.save(user);
    }
}
