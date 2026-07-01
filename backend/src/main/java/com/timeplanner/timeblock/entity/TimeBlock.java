package com.timeplanner.timeblock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_blocks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TimeBlock {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "block_type", nullable = false, length = 16)
    private String blockType;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "source_id", columnDefinition = "CHAR(36)")
    private String sourceId;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(nullable = false, length = 16)
    private String color;

    @Column(name = "is_manual_override", nullable = false)
    private boolean isManualOverride;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (status == null) status = "scheduled";
        if (color == null) color = "#6366F1";
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
