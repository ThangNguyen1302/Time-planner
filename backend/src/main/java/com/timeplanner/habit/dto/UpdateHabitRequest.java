package com.timeplanner.habit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHabitRequest {
    private String title;
    private String description;
    private Integer duration;
    private Integer frequency;
    private LocalTime preferredTimeStart;
    private LocalTime preferredTimeEnd;
    private String color;
    private Boolean isActive;
}
