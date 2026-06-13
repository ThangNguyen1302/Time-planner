package com.timeplanner.assistant.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantPlan {
    private String message;
    private String mood;
    private List<String> quickReplies;
    private List<PlannedAction> actions;

    public String moodOrDefault() {
        return mood == null || mood.isBlank() ? "neutral" : mood;
    }

    public List<String> quickRepliesOrEmpty() {
        return quickReplies == null ? List.of() : quickReplies;
    }

    public List<PlannedAction> actionsOrEmpty() {
        return actions == null ? List.of() : actions;
    }

    public static AssistantPlan ask(String message, String... replies) {
        return AssistantPlan.builder()
                .message(message)
                .mood("thinking")
                .quickReplies(List.of(replies))
                .actions(new ArrayList<>())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlannedAction {
        private String type;
        private Map<String, Object> data;
    }
}
