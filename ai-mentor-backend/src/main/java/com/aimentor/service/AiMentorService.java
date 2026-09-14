package com.aimentor.service;

import com.aimentor.dto.request.MentorRequest;
import com.aimentor.dto.response.MentorResponse;
import com.aimentor.entity.MentorSession;
import com.aimentor.entity.User;
import com.aimentor.entity.enums.SessionType;
import com.aimentor.exception.AiServiceException;
import com.aimentor.repository.MentorSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

/**
 * AI Mentor service — Spring AI edition.
 *
 * <h2>What changed from the previous implementation</h2>
 * <ul>
 *   <li>Removed: {@code GeminiProperties}, {@code RestTemplate}, {@code ObjectMapper},
 *       manual JSON parsing of the Gemini REST response envelope
 *       ({@code candidates[0].content.parts[0].text}), and the markdown-fence
 *       strip regex.</li>
 *   <li>Added: A single {@link ChatClient} bean (configured in {@code AiConfig})
 *       that handles transport, retries, and response extraction transparently.</li>
 *   <li>The four public methods and all prompt strings are <em>unchanged</em>.</li>
 * </ul>
 *
 * <h2>Why Spring AI</h2>
 * {@code ChatClient.prompt().user(prompt).call().content()} returns the model's
 * plain-text reply in one line.  Switching to OpenAI, Anthropic Claude, or any
 * other Spring AI provider requires only a pom.xml swap and two property changes —
 * this service file does not need to change.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiMentorService {

    // ── Dependencies ──────────────────────────────────────────────────────────
    // GeminiProperties is gone; ChatClient replaces RestTemplate + ObjectMapper.

    private final MentorSessionRepository  sessionRepo;
    private final InputSanitizationService sanitizer;
    private final AuditService             auditService;
    private final CloudinaryStorageService cloudinaryStorage;
    private final ChatClient               chatClient;      // Spring AI abstraction

    // ── Public API ────────────────────────────────────────────────────────────

    public MentorResponse generateRoadmap(MentorRequest req, User user) {
        String topic = sanitizer.sanitizeTopic(req.getTopic());
        return callAndPersist(topic, req.getLevel(),
                roadmapPrompt(topic, req.getLevel()),
                SessionType.ROADMAP, req.getQuestionCount(), user);
    }

    public MentorResponse generateExplanation(MentorRequest req, User user) {
        String topic = sanitizer.sanitizeTopic(req.getTopic());
        return callAndPersist(topic, req.getLevel(),
                explanationPrompt(topic, req.getLevel()),
                SessionType.EXPLANATION, req.getQuestionCount(), user);
    }

    public MentorResponse generateInterviewQA(MentorRequest req, User user) {
        String topic = sanitizer.sanitizeTopic(req.getTopic());
        int count = clamp(req.getQuestionCount(), 5, 20);
        return callAndPersist(topic, req.getLevel(),
                interviewPrompt(topic, req.getLevel(), count),
                SessionType.INTERVIEW_QA, count, user);
    }

    public MentorResponse generateQuiz(MentorRequest req, User user) {
        String topic = sanitizer.sanitizeTopic(req.getTopic());
        int count = clamp(req.getQuestionCount(), 5, 15);
        return callAndPersist(topic, req.getLevel(),
                quizPrompt(topic, req.getLevel(), count),
                SessionType.QUIZ, count, user);
    }

    // ── Prompts ───────────────────────────────────────────────────────────────
    // The global "JSON only" system prompt is set in AiConfig, so individual
    // prompts focus purely on the task.

    private String roadmapPrompt(String topic, String level) {
        return """
                Task: Create a detailed, phased learning roadmap.
                Topic: %s
                Skill Level: %s

                Required JSON structure:
                {
                  "title": "string — e.g. Learning Roadmap: Spring Boot",
                  "overview": "string — 2-3 sentence summary of what the learner will achieve",
                  "estimatedTime": "string — e.g. 3-6 months",
                  "prerequisites": ["string"],
                  "phases": [
                    {
                      "phase": 1,
                      "title": "string",
                      "duration": "string — e.g. 2-3 weeks",
                      "description": "string — what will be covered",
                      "topics": ["string"],
                      "resources": ["string — book, course, doc, or website name"],
                      "projects": ["string — hands-on project idea"],
                      "milestone": "string — what the learner can do after this phase"
                    }
                  ],
                  "careerPaths": ["string"],
                  "tools": ["string"],
                  "tips": ["string"]
                }

                Rules:
                - Include at least 4 phases.
                - Every array must have at least 2 items.
                """.formatted(topic, level);
    }

    private String explanationPrompt(String topic, String level) {
        return """
                Task: Explain the concept clearly and thoroughly.
                Topic: %s
                Audience level: %s

                Required JSON structure:
                {
                  "title": "string — e.g. Understanding: Docker Volumes",
                  "summary": "string — 2 plain-English sentences",
                  "concepts": [
                    {
                      "name": "string",
                      "explanation": "string",
                      "analogy": "string — real-world analogy",
                      "example": "string — short code snippet or concrete example"
                    }
                  ],
                  "howItWorks": "string — step-by-step explanation",
                  "useCases": ["string"],
                  "pros": ["string"],
                  "cons": ["string"],
                  "codeExample": "string — practical code snippet",
                  "commonMistakes": ["string"],
                  "furtherReading": ["string — resource name and URL or description"]
                }

                Rules:
                - Include at least 3 concepts.
                """.formatted(topic, level);
    }

    private String interviewPrompt(String topic, String level, int count) {
        return """
                Task: Generate %d technical interview questions with model answers.
                Topic: %s
                Level: %s

                Required JSON structure:
                {
                  "title": "string — e.g. Interview Prep: Kafka",
                  "level": "%s",
                  "totalQuestions": %d,
                  "questions": [
                    {
                      "id": 1,
                      "category": "string — one of: conceptual, behavioral, coding, system-design",
                      "difficulty": "string — one of: easy, medium, hard",
                      "question": "string",
                      "answer": "string — detailed model answer",
                      "keyPoints": ["string"],
                      "followUp": "string — likely follow-up question",
                      "redFlags": "string — what a weak answer looks like",
                      "tips": "string — interview advice for this question"
                    }
                  ],
                  "generalTips": ["string"],
                  "commonMistakes": ["string"],
                  "topicsToRevise": ["string"]
                }

                Rules:
                - id must be sequential integers starting at 1.
                - Output exactly %d question objects.
                """.formatted(count, topic, level, level, count, count);
    }

    private String quizPrompt(String topic, String level, int count) {
        return """
                Task: Create an educational multiple-choice quiz.
                Topic: %s
                Difficulty: %s
                Number of questions: %d

                Required JSON structure:
                {
                  "title": "string — e.g. Quiz: Java Streams",
                  "topic": "%s",
                  "difficulty": "%s",
                  "totalQuestions": %d,
                  "timeLimit": 15,
                  "passingScore": 70,
                  "questions": [
                    {
                      "id": 1,
                      "question": "string",
                      "options": {
                        "A": "string",
                        "B": "string",
                        "C": "string",
                        "D": "string"
                      },
                      "correctAnswer": "string — one of: A, B, C, D",
                      "explanation": "string — why the answer is correct",
                      "topic": "string — sub-topic",
                      "difficulty": "string — easy, medium, or hard"
                    }
                  ]
                }

                Rules:
                - timeLimit and passingScore must be plain integers (no quotes).
                - id must be sequential integers starting at 1.
                - Output exactly %d question objects.
                """.formatted(topic, level, count, topic, level, count, count);
    }

    // ── Core: call LLM → persist session → return response ───────────────────

    private MentorResponse callAndPersist(String topic, String level, String prompt,
                                           SessionType type, int qCount, User user) {
        long start = System.currentTimeMillis();
        try {
            // ── Spring AI call ─────────────────────────────────────────────────
            // One line replaces ~40 lines of RestTemplate boilerplate:
            //   • building HttpHeaders / HttpEntity
            //   • POSTing to the full Gemini URL
            //   • parsing candidates[0].content.parts[0].text from the envelope
            //   • stripping markdown fences
            // ChatClient also inherits the global system prompt set in AiConfig,
            // so "JSON only" is enforced without repeating it in every prompt.
            String raw = chatClient
                    .prompt()
                    .user(prompt)
                    .call()
                    .content();

            long duration = System.currentTimeMillis() - start;

            // Persist a preview (first 500 chars) to the DB
            String preview = raw.length() > 500 ? raw.substring(0, 500) : raw;

            MentorSession session = MentorSession.builder()
                    .user(user)
                    .topic(topic)
                    .sessionType(type)
                    .skillLevel(level)
                    .questionCount(qCount)
                    .response(preview)
                    .tokensUsed(estimateTokens(prompt + raw))
                    .durationMs(duration)
                    .build();
            sessionRepo.save(session);

            // Upload full result to Cloudinary
            String cloudinaryUrl = cloudinaryStorage.uploadSessionResult(
                    session.getId(), user.getUsername(), type.name(),
                    session.getSessionDate(), raw);
            if (cloudinaryUrl != null) {
                session.setCloudinaryUrl(cloudinaryUrl);
                sessionRepo.save(session);
            }

            auditService.log(user.getUsername(), "AI_REQUEST",
                    "/api/v1/mentor/" + type.name().toLowerCase(),
                    null, null, "SUCCESS",
                    "Generated " + type.name() + " for: " + topic);

            log.info("AI {} generated for user={} topic='{}' in {}ms",
                    type, user.getUsername(), topic, duration);

            return MentorResponse.builder()
                    .success(true)
                    .sessionId(session.getId())
                    .type(type.name())
                    .topic(topic)
                    .level(level)
                    .content(raw)
                    .cloudinaryUrl(cloudinaryUrl)
                    .durationMs(duration)
                    .createdAt(session.getCreatedAt())
                    .build();

        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI call failed for topic '{}': {}", topic, e.getMessage(), e);
            throw new AiServiceException(
                    "Failed to generate " + type.name() + ". Please try again.", e);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int estimateTokens(String text) { return text.length() / 4; }
    private int clamp(int val, int min, int max) { return Math.max(min, Math.min(max, val)); }
}
