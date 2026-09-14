package com.aimentor.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiErrorResponse {
    private boolean           success = false;
    private String            error;
    private String            message;
    private Map<String,String> fieldErrors;
    private LocalDateTime     timestamp;
    private String            path;
}
