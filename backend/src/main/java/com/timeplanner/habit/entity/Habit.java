package com.timeplanner.habit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "habits")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Habit {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private int duration;

    @Column(nullable = false)
    private int frequency;

    @Column(name = "preferred_time_start")
    private LocalTime preferredTimeStart;

    @Column(name = "preferred_time_end")
    private LocalTime preferredTimeEnd;

    @Column(nullable = false, length = 16)
    private String color;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

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
