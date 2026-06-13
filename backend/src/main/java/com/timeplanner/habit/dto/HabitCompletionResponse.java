package com.timeplanner.habit.dto;

import com.timeplanner.habit.entity.HabitCompletion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitCompletionResponse {
    private String id;
    private String habitId;
    private String userId;
    private LocalDateTime completedAt;
    private String notes;

    public static HabitCompletionResponse from(HabitCompletion hc) {
        return HabitCompletionResponse.builder()
                .id(hc.getId())
                .habitId(hc.getHabitId())
                .userId(hc.getUserId())
                .completedAt(hc.getCompletedAt())
                .notes(hc.getNotes())
                .build();
    }
}
