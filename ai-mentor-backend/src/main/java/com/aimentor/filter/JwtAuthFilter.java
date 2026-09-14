package com.aimentor.filter;

import com.aimentor.security.UserDetailsServiceImpl;
import com.aimentor.util.JwtUtil;
import com.aimentor.config.JwtProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Validates the JWT on every protected request and, once authenticated,
 * appends token-lifetime headers so the frontend can manage the warning
 * countdown without a separate polling call:
 *
 * <ul>
 *   <li>{@code X-Token-Expires-At}       — Unix epoch second of expiry</li>
 *   <li>{@code X-Token-Seconds-Remaining} — seconds left (≥ 0)</li>
 *   <li>{@code X-Token-Warning}           — "true" when within the warning window</li>
 *   <li>{@code X-Token-Urgent}            — "true" when within half the warning window</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil                jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtProperties          jwtProps;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain         chain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            final String jwt      = authHeader.substring(7);
            final String username = jwtUtil.extractUsername(jwt);

            if (username != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.isTokenValid(jwt, userDetails)) {
                    var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Authenticated [{}] → {}", username, request.getRequestURI());

                    // ── Append token-lifetime headers ──────────────────────
                    appendTokenLifetimeHeaders(response, jwt);
                }
            }
        } catch (Exception e) {
            log.warn("JWT filter error: {}", e.getMessage());
        }

        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // /api/v1/auth/** is public — skip JWT check there (login, register,
        // silent-refresh, token-status all handle their own auth)
        return path.startsWith("/api/v1/auth/")
            || path.startsWith("/actuator/")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/swagger-ui");
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void appendTokenLifetimeHeaders(HttpServletResponse response, String jwt) {
        try {
            long secondsRemaining = jwtUtil.secondsUntilExpiry(jwt);
            long expiresAt        = jwtUtil.extractExpirationEpochSecond(jwt);
            long threshold        = jwtProps.getWarningThresholdSeconds();
            boolean warn          = secondsRemaining <= threshold;
            boolean urgent        = secondsRemaining <= (threshold / 2);

            response.setHeader("X-Token-Expires-At",        String.valueOf(expiresAt));
            response.setHeader("X-Token-Seconds-Remaining", String.valueOf(secondsRemaining));
            response.setHeader("X-Token-Warning",           String.valueOf(warn));
            response.setHeader("X-Token-Urgent",            String.valueOf(urgent));
        } catch (Exception e) {
            log.debug("Could not append token lifetime headers: {}", e.getMessage());
        }
    }
}
