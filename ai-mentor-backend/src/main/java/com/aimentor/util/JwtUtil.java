package com.aimentor.util;

import com.aimentor.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtil {

    private final JwtProperties props;

    // ── Token Generation ──────────────────────────────────────────────────────

    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority).toList());
        claims.put("type", "access");
        return buildToken(claims, userDetails.getUsername(), props.getAccessTokenExpiryMs());
    }

    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return buildToken(claims, userDetails.getUsername(), props.getRefreshTokenExpiryMs());
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expiry) {
        return Jwts.builder()
            .setClaims(extraClaims)
            .setSubject(subject)
            .setId(UUID.randomUUID().toString())   // jti — unique per token
            .setIssuer("ai-mentor")
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiry))
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }

    // ── Token Validation ──────────────────────────────────────────────────────

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername())
                && !isTokenExpired(token)
                && "access".equals(extractClaim(token, c -> c.get("type", String.class)));
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isRefreshTokenValid(String token) {
        try {
            return !isTokenExpired(token)
                && "refresh".equals(extractClaim(token, c -> c.get("type", String.class)));
        } catch (JwtException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Returns seconds remaining until the token expires.
     * Returns 0 if already expired.
     */
    public long secondsUntilExpiry(String token) {
        Date exp = extractExpiration(token);
        long remaining = (exp.getTime() - System.currentTimeMillis()) / 1000;
        return Math.max(0, remaining);
    }

    /**
     * Returns true if the token is within the configured warning window
     * ({@code jwt.warning-threshold-seconds}) before expiry.
     */
    public boolean isInWarningWindow(String token) {
        return secondsUntilExpiry(token) <= props.getWarningThresholdSeconds();
    }

    // ── Claims Extraction ─────────────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /** Unix epoch second when the token expires — useful for response fields. */
    public long extractExpirationEpochSecond(String token) {
        return extractExpiration(token).toInstant().getEpochSecond();
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .requireIssuer("ai-mentor")
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    private Key getSigningKey() {
        String b64 = Base64.getEncoder().encodeToString(props.getSecret().getBytes());
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(b64));
    }
}
