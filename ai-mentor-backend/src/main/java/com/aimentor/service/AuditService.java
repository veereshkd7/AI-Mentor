package com.aimentor.service;

import com.aimentor.entity.AuditLog;
import com.aimentor.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Writes a security event asynchronously so it never blocks request processing.
     */
    @Async
    public void log(String username, String action, String resource,
                    String ipAddress, String userAgent, String status, String message) {
        try {
            AuditLog entry = AuditLog.builder()
                .username(username)
                .action(action)
                .resource(resource)
                .ipAddress(truncate(ipAddress, 50))
                .userAgent(truncate(userAgent, 300))
                .status(status)
                .message(truncate(message, 1000))
                .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Audit log write failed: {}", e.getMessage());
        }
    }

    /**
     * Purge audit logs older than 90 days — runs every night at 02:30.
     */
    @Scheduled(cron = "0 30 2 * * ?")
    public void purgeOldAuditLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        int deleted = auditLogRepository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            log.info("Purged {} audit log entries older than 90 days", deleted);
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
