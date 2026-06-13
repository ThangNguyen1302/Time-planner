package com.timeplanner.task.dto;

import com.timeplanner.task.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private String id;
    private String userId;
    private String title;
    private String description;
    private int duration;
    private LocalDateTime deadline;
    private int priority;
    private String status;
    private String color;
    private LocalDateTime completedAt;
    private String createdAt;
    private String updatedAt;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .userId(task.getUserId())
                .title(task.getTitle())
                .description(task.getDescription())
                .duration(task.getDuration())
                .deadline(task.getDeadline())
                .priority(task.getPriority())
                .status(task.getStatus())
                .color(task.getColor())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt() != null ? task.getCreatedAt().toString() : null)
                .updatedAt(task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : null)
                .build();
    }
}
