package com.aimentor.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    /** Access token lifetime — default 5 hours (18 000 000 ms). */
    private long accessTokenExpiryMs  = 18_000_000L;
    /** Refresh token lifetime — default 30 days (2 592 000 000 ms). */
    private long refreshTokenExpiryMs = 2_592_000_000L;
    /**
     * Seconds before access-token expiry at which the backend starts emitting
     * X-Token-Warning headers and the /token-status endpoint sets {@code warn=true}.
     * Default: 600 s (10 min).
     */
    private long warningThresholdSeconds = 600L;
}
