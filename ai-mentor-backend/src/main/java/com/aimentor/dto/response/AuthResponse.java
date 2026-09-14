package com.aimentor.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private boolean  success;
    private String   accessToken;
    private String   refreshToken;
    private String   tokenType;
    /** Seconds until the access token expires (from time of issuance). */
    private long     expiresIn;
    /** Unix epoch second at which the access token expires — convenient for client-side countdowns. */
    private long     tokenExpiresAt;
    /**
     * Seconds before expiry at which the client should begin warning the user
     * (matches {@code jwt.warning-threshold-seconds}).
     */
    private long     warningThresholdSeconds;
    private String   username;
    private String   email;
    private Set<String> roles;
}
