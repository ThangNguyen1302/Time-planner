package com.timeplanner.assistant.repository;

import com.timeplanner.assistant.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findTop12ByConversationIdOrderByCreatedAtDesc(String conversationId);
}
