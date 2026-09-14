package com.aimentor.config;

import org.springframework.ai.chat.client.ChatClient;   // ← was missing; root cause of "class not found"
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring AI {@link ChatClient} configuration.
 *
 * <h2>Provider</h2>
 * <p>The application uses <strong>Google Gemini via its OpenAI-compatible REST
 * endpoint</strong> ({@code https://generativelanguage.googleapis.com/v1beta/openai/}).
 * This requires only a free Gemini API key — no GCP project or billing needed.
 *
 * <p>Spring AI's {@code spring-ai-starter-model-openai} autoconfigures an
 * {@link org.springframework.ai.openai.OpenAiChatModel} bean, which is the
 * concrete {@link ChatModel} injected here.  Because this class only depends on
 * the {@link ChatClient} and {@link ChatModel} interfaces, switching to a
 * different provider (real OpenAI, Anthropic, Ollama …) requires only a
 * {@code pom.xml} dependency swap and two property changes — zero Java changes.
 *
 * <h2>Root cause fixed</h2>
 * <p>The previous version omitted {@code import org.springframework.ai.chat.client.ChatClient}
 * which caused a compile-time "class not found" error for {@code ChatClient}.
 */
@Configuration
public class AiConfig {

    /**
     * Exposes a {@link ChatClient} with a global system prompt pre-applied.
     *
     * <p>Every AI call in {@code AiMentorService} inherits the "JSON-only output"
     * instruction automatically, so individual prompts stay clean.
     *
     * <p>Spring AI's autoconfiguration creates the underlying {@link ChatModel}
     * bean from {@code application.properties}; this method simply wraps it.
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("""
                        You are an expert technical mentor API.
                        Always respond with ONLY a single valid JSON object.
                        Do not include markdown fences, prose, comments, or any \
                        text outside the JSON.
                        The very first character of every response must be '{'.
                        """)
                .build();
    }
}
