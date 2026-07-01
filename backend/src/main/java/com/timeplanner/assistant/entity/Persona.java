package com.timeplanner.assistant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "personas")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Persona {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 32)
    private String tone;

    @Column(nullable = false, length = 16)
    private String addressing;

    @Column(name = "emoji_level", nullable = false)
    private int emojiLevel;

    @Column(nullable = false, length = 16)
    private String verbosity;

    @Column(nullable = false)
    private int strictness;

    @Column(name = "style_rules", columnDefinition = "TEXT")
    private String styleRules;

    @Column(name = "is_preset", nullable = false)
    private boolean isPreset;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (tone == null) tone = "friendly";
        if (addressing == null) addressing = "ban";
        if (verbosity == null) verbosity = "normal";
        if (emojiLevel == 0) emojiLevel = 2;
        if (strictness == 0) strictness = 3;
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
