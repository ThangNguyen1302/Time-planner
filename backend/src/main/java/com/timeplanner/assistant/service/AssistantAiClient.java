package com.timeplanner.assistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AssistantAiClient {

    private final ObjectMapper objectMapper;
    private final AssistantRuleParser ruleParser;

    @Value("${app.assistant.provider:${ASSISTANT_PROVIDER:openrouter}}")
    private String provider;

    @Value("${app.assistant.openrouter-api-key:${OPENROUTER_API_KEY:}}")
    private String openRouterApiKey;

    @Value("${app.assistant.openrouter-model:${OPENROUTER_MODEL:meta-llama/llama-3.1-8b-instruct:free}}")
    private String openRouterModel;

    @Value("${app.assistant.openai-api-key:${OPENAI_API_KEY:}}")
    private String openAiApiKey;

    @Value("${app.assistant.openai-model:${OPENAI_MODEL:gpt-4o-mini}}")
    private String openAiModel;

    @Value("${app.assistant.gemini-api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${app.assistant.gemini-model:${GEMINI_MODEL:gemini-2.5-flash}}")
    private String geminiModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public AssistantPlan plan(String message, List<String> history) {
        if (!hasConfiguredProvider()) {
            return ruleParser.parse(message, history);
        }

        try {
            AssistantPlan plan = callModel(message, history);
            if (plan == null || plan.getMessage() == null || plan.getMessage().isBlank()) {
                return ruleParser.parse(message, history);
            }
            return plan;
        } catch (Exception ignored) {
            return ruleParser.parse(message, history);
        }
    }

    private boolean hasConfiguredProvider() {
        String resolvedProvider = resolveProvider();
        if ("openai".equalsIgnoreCase(resolvedProvider)) {
            return openAiApiKey != null && !openAiApiKey.isBlank();
        }
        if ("gemini".equalsIgnoreCase(resolvedProvider)) {
            return geminiApiKey != null && !geminiApiKey.isBlank();
        }
        return openRouterApiKey != null && !openRouterApiKey.isBlank();
    }

    private AssistantPlan callModel(String message, List<String> history) throws Exception {
        String resolvedProvider = resolveProvider();
        if ("gemini".equalsIgnoreCase(resolvedProvider)) {
            return callGemini(message, history);
        }

        String url = "openai".equalsIgnoreCase(resolvedProvider)
                ? "https://api.openai.com/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";
        String apiKey = "openai".equalsIgnoreCase(resolvedProvider) ? openAiApiKey : openRouterApiKey;
        String model = "openai".equalsIgnoreCase(resolvedProvider) ? openAiModel : openRouterModel;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt()));
        for (String item : history) {
            messages.add(Map.of("role", "user", "content", item));
        }
        messages.add(Map.of("role", "user", "content", message));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", 0.1);
        payload.put("messages", messages);
        payload.put("response_format", Map.of("type", "json_object"));

        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(40))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Assistant provider failed: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText();
        return objectMapper.readValue(content, AssistantPlan.class);
    }

    private AssistantPlan callGemini(String message, List<String> history) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent";
        StringBuilder prompt = new StringBuilder(systemPrompt());
        if (!history.isEmpty()) {
            prompt.append("\n\nRecent conversation:\n");
            for (String item : history) {
                prompt.append("- ").append(item).append("\n");
            }
        }
        prompt.append("\nUser message:\n").append(message);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", prompt.toString()))
        )));
        payload.put("generationConfig", Map.of(
                "temperature", 0.1,
                "responseMimeType", "application/json"
        ));

        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(40))
                .header("x-goog-api-key", geminiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Gemini provider failed: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
        return objectMapper.readValue(content, AssistantPlan.class);
    }

    private String resolveProvider() {
        if (provider != null && !provider.isBlank()) {
            if ("gemini".equalsIgnoreCase(provider) || "openai".equalsIgnoreCase(provider) || "openrouter".equalsIgnoreCase(provider)) {
                if ("openrouter".equalsIgnoreCase(provider)
                        && (openRouterApiKey == null || openRouterApiKey.isBlank())
                        && geminiApiKey != null
                        && !geminiApiKey.isBlank()) {
                    return "gemini";
                }
                return provider;
            }
        }
        if (geminiApiKey != null && !geminiApiKey.isBlank()) return "gemini";
        if (openAiApiKey != null && !openAiApiKey.isBlank()) return "openai";
        return "openrouter";
    }

    private String systemPrompt() {
        return """
                You are TimePlanner's assistant. Return only valid JSON.
                The user speaks Vietnamese or English.
                If the user writes Vietnamese, respond in natural Vietnamese with full diacritics.
                Timezone: Asia/Ho_Chi_Minh. Current date should be interpreted by the backend runtime.

                Required JSON schema:
                {
                  "message": "short user-facing response",
                  "mood": "neutral|happy|serious|encouraging|warning|thinking",
                  "quickReplies": ["max 3 short replies"],
                  "actions": [
                    {
                      "type": "create_task|create_event|update_task|update_event|delete_task|delete_event",
                      "data": {}
                    }
                  ]
                }

                create_task data:
                - title: required
                - description: optional
                - duration: optional integer minutes, default 30
                - deadline: optional ISO local datetime, e.g. 2026-06-07T17:00:00
                - priority: optional integer 1-5

                create_event data:
                - title: required
                - description: optional
                - startTime: required ISO local datetime
                - endTime: required ISO local datetime

                update_task data:
                - id: optional if known
                - targetTitle: required when id is missing; title of the existing task to find
                - title, description, duration, deadline, priority, status, color: optional fields to update
                - status values: pending, in_progress, completed, skipped, overdue

                update_event data:
                - id: optional if known
                - targetTitle: required when id is missing; title of the existing event to find
                - title, description, startTime, endTime, color: optional fields to update

                delete_task and delete_event data:
                - id: optional if known
                - targetTitle: required when id is missing; title of the existing item to delete
                - only return a delete action when the user explicitly asks to delete or cancel that item

                For update actions, never put the new title in targetTitle. Use targetTitle for the existing item and title for the new title.

                If required information is missing, return no actions and ask exactly one clarifying question.
                Do not invent dates or times when ambiguous.
                """;
    }
}
