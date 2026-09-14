package com.aimentor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateProfileRequest {

    @Email(message = "Invalid email address")
    @Size(max = 200)
    private String email;

    /** Current password — required to authorise any profile change. */
    @Size(min = 1, max = 200, message = "Current password is required")
    private String currentPassword;

    /** New password — optional; if blank the password is not changed. */
    @Size(min = 8, max = 200, message = "New password must be at least 8 characters")
    private String newPassword;
}
