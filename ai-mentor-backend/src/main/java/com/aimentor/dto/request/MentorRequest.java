package com.aimentor.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MentorRequest {

    @NotBlank(message = "Topic is required")
    @Size(min = 2, max = 200, message = "Topic must be 2–200 characters")
    private String topic;

    @NotBlank(message = "Skill level is required")
    @Pattern(regexp = "^(beginner|intermediate|advanced)$",
             message = "Level must be: beginner, intermediate, or advanced")
    private String level;

    @Min(value = 5,  message = "Minimum 5 questions")
    @Max(value = 20, message = "Maximum 20 questions")
    private int questionCount = 10;
}
