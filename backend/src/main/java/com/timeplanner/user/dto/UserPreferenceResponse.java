package com.timeplanner.user.dto;

import com.timeplanner.user.entity.UserPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceResponse {
    private String id;
    private String userId;
    private LocalTime wakeTime;
    private LocalTime sleepTime;
    private LocalTime workStart;
    private LocalTime workEnd;
    private String timezone;
    private List<Integer> restDays;
    private String createdAt;
    private String updatedAt;

    public static UserPreferenceResponse from(UserPreference pref) {
        List<Integer> days = pref.getRestDays() != null && !pref.getRestDays().isBlank()
                ? Arrays.stream(pref.getRestDays().split(","))
                    .map(String::trim)
                    .map(Integer::parseInt)
                    .collect(Collectors.toList())
                : List.of();

        return UserPreferenceResponse.builder()
                .id(pref.getId())
                .userId(pref.getUserId())
                .wakeTime(pref.getWakeTime())
                .sleepTime(pref.getSleepTime())
                .workStart(pref.getWorkStart())
                .workEnd(pref.getWorkEnd())
                .timezone(pref.getTimezone())
                .restDays(days)
                .createdAt(pref.getCreatedAt() != null ? pref.getCreatedAt().toString() : null)
                .updatedAt(pref.getUpdatedAt() != null ? pref.getUpdatedAt().toString() : null)
                .build();
    }
}
