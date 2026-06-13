package com.timeplanner.user.controller;

import com.timeplanner.user.dto.UpdatePreferenceRequest;
import com.timeplanner.user.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/preferences")
@RequiredArgsConstructor
public class UserPreferenceController {

    private final UserPreferenceService preferenceService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPreferences(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", preferenceService.getPreferences(userId)));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updatePreferences(
            Authentication authentication,
            @RequestBody UpdatePreferenceRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", preferenceService.updatePreferences(userId, request)));
    }
}
