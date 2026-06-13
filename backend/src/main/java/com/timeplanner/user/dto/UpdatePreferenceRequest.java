package com.timeplanner.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferenceRequest {
    private LocalTime wakeTime;
    private LocalTime sleepTime;
    private LocalTime workStart;
    private LocalTime workEnd;
    private String timezone;
    private List<Integer> restDays;
}
