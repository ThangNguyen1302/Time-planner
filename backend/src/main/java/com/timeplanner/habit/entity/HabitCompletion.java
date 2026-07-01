package com.timeplanner.habit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;

@Entity
@Table(name = "habit_completions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HabitCompletion {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "habit_id", nullable = false, columnDefinition = "CHAR(36)")
    private String habitId;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    void onCreate() {
        if (completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
