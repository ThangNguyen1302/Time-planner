package com.timeplanner.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantChatResponse {
    private String conversationId;
    private AssistantMessageDto message;
    private List<AssistantActionDto> actions;
}
