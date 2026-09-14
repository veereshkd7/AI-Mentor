package com.aimentor.controller;

import com.aimentor.dto.request.UpdateProfileRequest;
import com.aimentor.dto.response.ProfileResponse;
import com.aimentor.entity.User;
import com.aimentor.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User", description = "Profile management and account operations")
@PreAuthorize("hasAnyRole('USER','ADMIN')")
public class UserController {

    private final UserService userService;

    /** GET /api/v1/user/profile — returns the caller's profile + session stats */
    @GetMapping("/profile")
    @Operation(summary = "Get current user's profile")
    public ResponseEntity<ProfileResponse> getProfile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getProfile(user));
    }

    /** PUT /api/v1/user/profile — update email and/or password */
    @PutMapping("/profile")
    @Operation(summary = "Update email or password",
               description = "currentPassword is always required. " +
                             "Provide newPassword to change it. " +
                             "Provide email to change it. " +
                             "Changing the password invalidates all active sessions.")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(user, request));
    }

    /** DELETE /api/v1/user/account — permanently delete the account */
    @DeleteMapping("/account")
    @Operation(summary = "Permanently delete the account",
               description = "Deletes the user account, all sessions, and all Cloudinary assets. " +
                             "Requires the account password for confirmation.")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        userService.deleteAccount(user, password);
        return ResponseEntity.noContent().build();
    }
}
