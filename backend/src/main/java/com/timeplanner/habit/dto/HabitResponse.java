package com.timeplanner.habit.dto;

import com.timeplanner.habit.entity.Habit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {
    private String id;
    private String userId;
    private String title;
    private String description;
    private int duration;
    private int frequency;
    private LocalTime preferredTimeStart;
    private LocalTime preferredTimeEnd;
    private String color;
    private boolean isActive;
    private String createdAt;
    private String updatedAt;

    public static HabitResponse from(Habit habit) {
        return HabitResponse.builder()
                .id(habit.getId())
                .userId(habit.getUserId())
                .title(habit.getTitle())
                .description(habit.getDescription())
                .duration(habit.getDuration())
                .frequency(habit.getFrequency())
                .preferredTimeStart(habit.getPreferredTimeStart())
                .preferredTimeEnd(habit.getPreferredTimeEnd())
                .color(habit.getColor())
                .isActive(habit.isActive())
                .createdAt(habit.getCreatedAt() != null ? habit.getCreatedAt().toString() : null)
                .updatedAt(habit.getUpdatedAt() != null ? habit.getUpdatedAt().toString() : null)
                .build();
    }
}
