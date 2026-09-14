package com.aimentor.filter;

import io.github.bucket4j.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiting using Bucket4j token-bucket algorithm.
 *
 * Auth endpoints: 10 req / min (prevents brute-force)
 * AI  endpoints: 10 req / min (Anthropic API cost control)
 * General:       60 req / min
 *
 * Headers returned on every response:
 *   X-RateLimit-Limit     — bucket capacity
 *   X-RateLimit-Remaining — tokens left
 *   Retry-After           — seconds until refill (429 only)
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.general.capacity:60}")
    private int generalCapacity;

    @Value("${rate-limit.auth.capacity:10}")
    private int authCapacity;

    @Value("${rate-limit.ai.capacity:10}")
    private int aiCapacity;

    // Thread-safe per-IP bucket caches
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets    = new ConcurrentHashMap<>();
    private final Map<String, Bucket> aiBuckets      = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String ip     = resolveClientIp(request);
        String path   = request.getServletPath();

        Bucket bucket;
        int    limit;

        if (path.startsWith("/api/v1/auth/")) {
            bucket = authBuckets.computeIfAbsent(ip, k -> buildBucket(authCapacity, 60));
            limit  = authCapacity;
        } else if (path.startsWith("/api/v1/mentor/")) {
            bucket = aiBuckets.computeIfAbsent(ip, k -> buildBucket(aiCapacity, 60));
            limit  = aiCapacity;
        } else {
            bucket = generalBuckets.computeIfAbsent(ip, k -> buildBucket(generalCapacity, 60));
            limit  = generalCapacity;
        }

        long remaining = bucket.getAvailableTokens();
        response.setHeader("X-RateLimit-Limit",     String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, remaining - 1)));

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded: ip={} path={}", ip, path);
            response.setContentType("application/json");
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                "{\"success\":false,\"error\":\"RATE_LIMIT_EXCEEDED\"," +
                "\"message\":\"Too many requests. Please wait before retrying.\"}");
        }
    }

    private Bucket buildBucket(int capacity, int refillPerMinute) {
        Bandwidth limit = Bandwidth.classic(
            capacity,
            Refill.greedy(refillPerMinute, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) return xri.trim();
        return request.getRemoteAddr();
    }
}
