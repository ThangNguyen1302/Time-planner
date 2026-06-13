package com.timeplanner.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssistantChatRequest {
    @NotBlank(message = "message is required")
    private String message;
    private String conversationId;
}
