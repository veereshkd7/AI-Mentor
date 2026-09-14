package com.aimentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * AI Mentor Application Entry Point
 *
 * Architecture overview:
 *  - React 18 frontend (Vite, port 5173)
 *  - Spring Boot 3.2 REST API (port 8080)
 *  - H2 in-memory DB (dev) / PostgreSQL (prod)
 *  - Anthropic Claude API for AI content generation
 *
 * Security layers:
 *  1. HTTPS + HSTS
 *  2. Security headers (CSP, nosniff, referrer-policy)
 *  3. CORS whitelist
 *  4. Rate limiting per IP (Bucket4j)
 *  5. JWT authentication (HS512, 15-min access + 7-day refresh)
 *  6. Method-level authorization (@PreAuthorize)
 *  7. Input sanitization (XSS, SQL, prompt injection)
 *  8. Account lockout (5 failures → 30-min lock)
 *  9. Async audit logging for all security events
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class AiMentorApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiMentorApplication.class, args);
    }
}
