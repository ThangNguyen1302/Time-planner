package com.timeplanner.assistant.repository;

import com.timeplanner.assistant.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, String> {
    Optional<Conversation> findByIdAndUserId(String id, String userId);
}
