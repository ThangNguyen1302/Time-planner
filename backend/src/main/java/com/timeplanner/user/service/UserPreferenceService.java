package com.timeplanner.user.service;

import com.timeplanner.user.dto.UpdatePreferenceRequest;
import com.timeplanner.user.dto.UserPreferenceResponse;
import com.timeplanner.user.entity.UserPreference;
import com.timeplanner.user.repository.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    private final UserPreferenceRepository preferenceRepository;

    public UserPreferenceResponse getPreferences(String userId) {
        UserPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        return UserPreferenceResponse.from(pref);
    }

    @Transactional
    public UserPreferenceResponse updatePreferences(String userId, UpdatePreferenceRequest request) {
        UserPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));

        if (request.getWakeTime() != null) pref.setWakeTime(request.getWakeTime());
        if (request.getSleepTime() != null) pref.setSleepTime(request.getSleepTime());
        if (request.getWorkStart() != null) pref.setWorkStart(request.getWorkStart());
        if (request.getWorkEnd() != null) pref.setWorkEnd(request.getWorkEnd());
        if (request.getTimezone() != null) pref.setTimezone(request.getTimezone());
        if (request.getRestDays() != null) {
            String restDaysStr = request.getRestDays().stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            pref.setRestDays(restDaysStr);
        }

        return UserPreferenceResponse.from(preferenceRepository.save(pref));
    }

    private UserPreference createDefaultPreferences(String userId) {
        UserPreference pref = UserPreference.builder()
                .userId(userId)
                .wakeTime(LocalTime.of(7, 0))
                .sleepTime(LocalTime.of(23, 0))
                .workStart(LocalTime.of(8, 0))
                .workEnd(LocalTime.of(17, 0))
                .timezone("Asia/Ho_Chi_Minh")
                .restDays("0,6")
                .build();
        return preferenceRepository.save(pref);
    }
}
