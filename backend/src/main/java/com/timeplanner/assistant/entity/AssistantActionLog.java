package com.timeplanner.assistant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "assistant_action_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AssistantActionLog {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "message_id", length = 36)
    private String messageId;

    @Column(name = "action_type", nullable = false, length = 64)
    private String actionType;

    @Column(name = "action_data", columnDefinition = "TEXT", nullable = false)
    private String actionData;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "can_undo", nullable = false)
    private boolean canUndo;

    @Column(name = "undone_at")
    private LocalDateTime undoneAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
