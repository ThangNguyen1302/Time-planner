package com.timeplanner.habit.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateHabitRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    @Min(value = 1, message = "Thời lượng phải lớn hơn 0")
    private int duration = 30;

    @Min(value = 1, message = "Tần suất phải lớn hơn 0")
    private int frequency = 1;

    private LocalTime preferredTimeStart;
    private LocalTime preferredTimeEnd;
    private String color;
}
