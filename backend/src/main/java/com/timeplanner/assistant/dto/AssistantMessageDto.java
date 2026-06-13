package com.timeplanner.assistant.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantMessageDto {
    private String id;

    @JsonProperty("conversation_id")
    private String conversationId;

    @JsonProperty("user_id")
    private String userId;

    private String role;
    private String content;
    private String mood;
    private List<AssistantActionDto> actions;

    @JsonProperty("quick_replies")
    private List<String> quickReplies;

    @JsonProperty("is_proactive")
    private boolean isProactive;

    @JsonProperty("created_at")
    private String createdAt;
}
