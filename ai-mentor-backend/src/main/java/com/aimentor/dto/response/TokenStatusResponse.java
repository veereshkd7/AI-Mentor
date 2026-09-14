package com.aimentor.dto.response;

import lombok.*;

/**
 * Returned by {@code GET /api/v1/auth/token-status}.
 * Tells the client exactly how much time is left on the current access token
 * and whether it has entered the warning window.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TokenStatusResponse {
    /** Unix epoch second when the access token expires. */
    private long    tokenExpiresAt;
    /** Seconds remaining until the access token expires. */
    private long    secondsRemaining;
    /**
     * True when {@code secondsRemaining} is within the configured warning
     * threshold. The client should prompt the user to re-login or call
     * {@code POST /api/v1/auth/silent-refresh}.
     */
    private boolean warn;
    /**
     * True if this is the last warning before token expiry
     * (i.e. within half the warning threshold). Client should show a more
     * urgent prompt.
     */
    private boolean urgent;
    /** Seconds of the warning window (from config). */
    private long    warningThresholdSeconds;
}
