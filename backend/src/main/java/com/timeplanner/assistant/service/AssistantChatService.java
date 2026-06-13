package com.timeplanner.assistant.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeplanner.assistant.dto.AssistantActionDto;
import com.timeplanner.assistant.dto.AssistantChatResponse;
import com.timeplanner.assistant.dto.AssistantMessageDto;
import com.timeplanner.assistant.entity.AssistantActionLog;
import com.timeplanner.assistant.entity.Conversation;
import com.timeplanner.assistant.entity.Message;
import com.timeplanner.assistant.repository.AssistantActionLogRepository;
import com.timeplanner.assistant.repository.ConversationRepository;
import com.timeplanner.assistant.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AssistantActionLogRepository actionLogRepository;
    private final AssistantAiClient aiClient;
    private final AssistantActionExecutor actionExecutor;
    private final ObjectMapper objectMapper;

    @Transactional
    public AssistantChatResponse chat(String userId, String messageText, String conversationId) {
        Conversation conversation = resolveConversation(userId, conversationId, messageText);
        List<String> history = recentHistory(conversation.getId());

        Message userMessage = Message.builder()
                .conversationId(conversation.getId())
                .userId(userId)
                .role("user")
                .content(messageText)
                .actions("[]")
                .quickReplies("[]")
                .isProactive(false)
                .build();
        messageRepository.save(userMessage);

        AssistantPlan plan = aiClient.plan(messageText, history);
        List<AssistantActionDto> executedActions = new ArrayList<>();
        String assistantContent = plan.getMessage();

        try {
            for (AssistantPlan.PlannedAction action : plan.actionsOrEmpty()) {
                executedActions.add(actionExecutor.execute(userId, action));
            }
            if (!executedActions.isEmpty()) {
                assistantContent = successMessage(plan, executedActions);
            }
        } catch (IllegalArgumentException e) {
            assistantContent = e.getMessage();
            executedActions.clear();
            plan.setMood("warning");
        }

        Message assistantMessage = Message.builder()
                .conversationId(conversation.getId())
                .userId(userId)
                .role("assistant")
                .content(assistantContent)
                .mood(plan.moodOrDefault())
                .actions(toJson(executedActions))
                .quickReplies(toJson(plan.quickRepliesOrEmpty()))
                .isProactive(false)
                .build();
        assistantMessage = messageRepository.save(assistantMessage);

        for (AssistantActionDto action : executedActions) {
            actionLogRepository.save(AssistantActionLog.builder()
                    .userId(userId)
                    .messageId(assistantMessage.getId())
                    .actionType(action.getType())
                    .actionData(toJson(action.getData()))
                    .result(toJson(action.getResult()))
                    .canUndo(false)
                    .build());
        }

        return AssistantChatResponse.builder()
                .conversationId(conversation.getId())
                .message(toDto(assistantMessage, executedActions, plan.quickRepliesOrEmpty()))
                .actions(executedActions)
                .build();
    }

    private Conversation resolveConversation(String userId, String conversationId, String firstMessage) {
        if (conversationId != null && !conversationId.isBlank()) {
            return conversationRepository.findByIdAndUserId(conversationId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        }

        String title = firstMessage.length() > 60 ? firstMessage.substring(0, 60) : firstMessage;
        Conversation conversation = Conversation.builder()
                .userId(userId)
                .title(title)
                .isActive(true)
                .build();
        return conversationRepository.save(conversation);
    }

    private List<String> recentHistory(String conversationId) {
        List<Message> messages = new ArrayList<>(messageRepository.findTop12ByConversationIdOrderByCreatedAtDesc(conversationId));
        Collections.reverse(messages);
        return messages.stream()
                .map(message -> message.getRole() + ": " + message.getContent())
                .toList();
    }

    private String successMessage(AssistantPlan plan, List<AssistantActionDto> actions) {
        if (actions.size() == 1) {
            AssistantActionDto action = actions.get(0);
            Object resultTitle = action.getResult() == null ? null : action.getResult().get("title");
            Object dataTitle = action.getData() == null ? null : action.getData().get("title");
            Object titleForMessage = resultTitle == null ? dataTitle : resultTitle;
            if ("create_task".equals(action.getType())) {
                return "Đã tạo task" + (titleForMessage == null ? "." : " \"" + titleForMessage + "\".");
            }
            if ("create_event".equals(action.getType())) {
                return "Đã tạo event" + (titleForMessage == null ? "." : " \"" + titleForMessage + "\".");
            }
            if ("update_task".equals(action.getType())) {
                return "Đã cập nhật task" + (titleForMessage == null ? "." : " \"" + titleForMessage + "\".");
            }
            if ("update_event".equals(action.getType())) {
                return "Đã cập nhật event" + (titleForMessage == null ? "." : " \"" + titleForMessage + "\".");
            }
            Object title = action.getData() == null ? null : action.getData().get("title");
            if ("create_task".equals(action.getType())) {
                return "Đã tạo task" + (title == null ? "." : " \"" + title + "\".");
            }
            if ("create_event".equals(action.getType())) {
                return "Đã tạo event" + (title == null ? "." : " \"" + title + "\".");
            }
        }
        return plan.getMessage() == null || plan.getMessage().isBlank()
                ? "Đã thực hiện yêu cầu của bạn."
                : plan.getMessage();
    }

    private AssistantMessageDto toDto(Message message, List<AssistantActionDto> actions, List<String> quickReplies) {
        return AssistantMessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .userId(message.getUserId())
                .role(message.getRole())
                .content(message.getContent())
                .mood(message.getMood())
                .actions(actions)
                .quickReplies(quickReplies)
                .isProactive(message.isProactive())
                .createdAt(message.getCreatedAt() == null ? null : message.getCreatedAt().toString())
                .build();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize assistant payload", e);
        }
    }
}
