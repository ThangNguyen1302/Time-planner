package com.timeplanner.assistant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "avatars")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Avatar {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(nullable = false, length = 32)
    private String mood;

    @Column(name = "is_preset", nullable = false)
    private boolean isPreset;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(columnDefinition = "TEXT")
    private String config;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (mood == null) mood = "neutral";
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
