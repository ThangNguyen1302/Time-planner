package com.timeplanner.assistant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.Instant;

@Entity
@Table(name = "reminder_rules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ReminderRule {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "rule_type", nullable = false, length = 32)
    private String ruleType;

    @Column(name = "trigger_minutes", nullable = false)
    private int triggerMinutes;

    @Column(name = "max_reminders", nullable = false)
    private int maxReminders;

    @Column(name = "nudge_style", nullable = false, length = 16)
    private String nudgeStyle;

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
