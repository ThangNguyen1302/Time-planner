package com.timeplanner.assistant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_memory")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserMemory {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "memory_type", nullable = false, length = 32)
    private String memoryType;

    @Column(name = "`key`", nullable = false, length = 255)
    private String key;

    @Column(name = "value", columnDefinition = "json", nullable = false)
    private String value;

    @Column(name = "confidence", nullable = false, precision = 3, scale = 2)
    private BigDecimal confidence;

    @Column(name = "source", nullable = false, length = 16)
    private String source;

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
