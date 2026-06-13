package com.timeplanner.task.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {
    private String title;
    private String description;
    private Integer duration;
    private LocalDateTime deadline;
    private Integer priority;
    private String status;
    private String color;
}
