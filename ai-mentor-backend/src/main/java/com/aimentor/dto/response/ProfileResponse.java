package com.aimentor.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileResponse {
    private String        username;
    private String        email;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private long          totalSessions;
    private String        message;
}
