package com.aimentor.controller;

import com.aimentor.dto.request.LoginRequest;
import com.aimentor.dto.request.RefreshTokenRequest;
import com.aimentor.dto.request.RegisterRequest;
import com.aimentor.dto.response.AuthResponse;
import com.aimentor.dto.response.TokenStatusResponse;
import com.aimentor.service.AuthService;
import com.aimentor.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login, and token management")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil     jwtUtil;

    // ── Register ──────────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new user account",
               responses = {
                   @ApiResponse(responseCode = "200", description = "Registered successfully"),
                   @ApiResponse(responseCode = "400", description = "Validation error"),
                   @ApiResponse(responseCode = "409", description = "Username or email already taken")
               })
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
            authService.register(request, resolveIp(httpRequest)));
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Login and receive a 5-hour access token + 30-day refresh token",
               responses = {
                   @ApiResponse(responseCode = "200", description = "Login successful"),
                   @ApiResponse(responseCode = "401", description = "Invalid credentials"),
                   @ApiResponse(responseCode = "423", description = "Account locked")
               })
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(
            request,
            resolveIp(httpRequest),
            httpRequest.getHeader("User-Agent")));
    }

    // ── Silent Refresh ────────────────────────────────────────────────────────

    /**
     * Exchange a valid refresh token for a brand-new access + refresh token pair
     * WITHOUT requiring the user to enter credentials again.
     *
     * <p>Call this endpoint proactively when {@code X-Token-Warning: true} is
     * received on any response header, or when {@code GET /token-status} returns
     * {@code warn=true}. The session continues uninterrupted.
     */
    @PostMapping("/silent-refresh")
    @Operation(summary = "Silently rotate the access token — keeps the session alive without re-login",
               description = "Send the current refresh token. A new access token (5 h) and " +
                             "refresh token (30 d) are issued. Old refresh token is invalidated " +
                             "(refresh token rotation). Session never expires as long as the " +
                             "user remains active within the 30-day refresh window.",
               responses = {
                   @ApiResponse(responseCode = "200", description = "New tokens issued"),
                   @ApiResponse(responseCode = "401", description = "Refresh token invalid or superseded")
               })
    public ResponseEntity<AuthResponse> silentRefresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.silentRefresh(request.getRefreshToken()));
    }

    // ── Manual Refresh (backward-compat alias) ────────────────────────────────

    @PostMapping("/refresh")
    @Operation(summary = "Alias for /silent-refresh — kept for backward compatibility")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    // ── Token Status ──────────────────────────────────────────────────────────

    /**
     * Poll this endpoint to check how much time is left on the current access
     * token and whether the warning window has been entered.
     *
     * <p>Alternatively the frontend can read the {@code X-Token-Expires-At} and
     * {@code X-Token-Warning} response headers that are appended to every
     * authenticated API response — no polling required.
     */
    @GetMapping("/token-status")
    @Operation(summary = "Return remaining lifetime of the caller's current access token",
               description = "Returns secondsRemaining, tokenExpiresAt, warn (within warning " +
                             "window), and urgent (within half the warning window). Use this to " +
                             "drive a client-side countdown or proactive silent-refresh.",
               responses = {
                   @ApiResponse(responseCode = "200", description = "Status returned"),
                   @ApiResponse(responseCode = "401", description = "No valid access token")
               })
    public ResponseEntity<TokenStatusResponse> tokenStatus(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String token      = (authHeader != null && authHeader.startsWith("Bearer "))
            ? authHeader.substring(7) : null;

        if (token == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.tokenStatus(token));
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate the current refresh token")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank())
            ? xff.split(",")[0].trim()
            : request.getRemoteAddr();
    }
}
