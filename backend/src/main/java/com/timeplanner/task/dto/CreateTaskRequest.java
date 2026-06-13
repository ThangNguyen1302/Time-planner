package com.timeplanner.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    @Min(value = 1, message = "Thời lượng phải lớn hơn 0")
    private int duration = 30;

    private LocalDateTime deadline;

    private int priority = 2;

    private String color;
}
