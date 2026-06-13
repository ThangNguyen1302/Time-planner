package com.timeplanner.assistant.controller;

import com.timeplanner.assistant.dto.AssistantChatRequest;
import com.timeplanner.assistant.dto.AssistantChatResponse;
import com.timeplanner.assistant.service.AssistantChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantChatService assistantChatService;

    @PostMapping("/chat")
    public ResponseEntity<AssistantChatResponse> chat(
            Authentication authentication,
            @Valid @RequestBody AssistantChatRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(assistantChatService.chat(userId, request.getMessage(), request.getConversationId()));
    }
}
