package com.aimentor.controller;

import com.aimentor.dto.request.MentorRequest;
import com.aimentor.dto.response.MentorResponse;
import com.aimentor.dto.response.SessionHistoryResponse;
import com.aimentor.entity.User;
import com.aimentor.service.AiMentorService;
import com.aimentor.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mentor")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Mentor", description = "AI-powered learning content generation")
@PreAuthorize("hasAnyRole('USER','ADMIN')")
public class MentorController {

    private final AiMentorService mentorService;
    private final SessionService  sessionService;

    @PostMapping("/roadmap")
    @Operation(summary = "Generate a structured learning roadmap for any topic")
    public ResponseEntity<MentorResponse> roadmap(
            @Valid @RequestBody MentorRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mentorService.generateRoadmap(request, user));
    }

    @PostMapping("/explain")
    @Operation(summary = "Get a deep explanation of any concept")
    public ResponseEntity<MentorResponse> explain(
            @Valid @RequestBody MentorRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mentorService.generateExplanation(request, user));
    }

    @PostMapping("/interview")
    @Operation(summary = "Generate interview questions and model answers")
    public ResponseEntity<MentorResponse> interview(
            @Valid @RequestBody MentorRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mentorService.generateInterviewQA(request, user));
    }

    @PostMapping("/quiz")
    @Operation(summary = "Generate an interactive timed quiz")
    public ResponseEntity<MentorResponse> quiz(
            @Valid @RequestBody MentorRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mentorService.generateQuiz(request, user));
    }

    @GetMapping("/history")
    @Operation(summary = "Get the current user's session history")
    public ResponseEntity<List<SessionHistoryResponse>> history(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sessionService.getUserHistory(user));
    }

    @GetMapping("/history/{id}")
    @Operation(summary = "Reload a past session by ID")
    public ResponseEntity<MentorResponse> getSession(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sessionService.getSession(id, user));
    }

    @DeleteMapping("/history/{id}")
    @Operation(summary = "Delete a past session")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        sessionService.deleteSession(id, user);
        return ResponseEntity.noContent().build();
    }
}
