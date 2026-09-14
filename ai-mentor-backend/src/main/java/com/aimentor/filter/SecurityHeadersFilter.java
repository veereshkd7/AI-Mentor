package com.aimentor.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Adds extra security response headers not covered by Spring Security's
 * built-in header writers.
 */
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         chain)
            throws ServletException, IOException {

        // Prevent MIME-type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Restrict referrer information
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Disable browser features not needed
        response.setHeader("Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

        // Hide server technology
        response.setHeader("Server", "AI-Mentor/1.0");
        response.setHeader("X-Powered-By", "");

        // No-cache for API responses (tokens/data should not be cached)
        if (request.getServletPath().startsWith("/api/")) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
        }

        chain.doFilter(request, response);
    }
}
