package com.timeplanner.integration.google.controller;

import com.timeplanner.common.util.DateTimeParser;
import com.timeplanner.integration.google.dto.GoogleCalendarEventDto;
import com.timeplanner.integration.google.service.GoogleCalendarService;
import com.timeplanner.integration.google.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/integrations/google")
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarController {

    private final GoogleOAuthService oAuthService;
    private final GoogleCalendarService calendarService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Step 1: Get the Google OAuth consent URL.
     * Frontend opens this URL in a new window/tab.
     */
    @GetMapping("/auth-url")
    public ResponseEntity<Map<String, Object>> getAuthUrl(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String url = oAuthService.getAuthorizationUrl(userId);
        return ResponseEntity.ok(Map.of("data", Map.of("url", url)));
    }

    /**
     * Step 2: Google redirects here after user grants consent.
     * This is a public endpoint (no JWT needed).
     * After processing, redirects to frontend with success/error status.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> handleCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String userId,
            @RequestParam(value = "error", required = false) String error) {

        if (error != null) {
            log.warn("Google OAuth error: {}", error);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/dashboard/settings?google=error&reason=" + error)
                    .build();
        }

        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/dashboard/settings?google=error&reason=missing_state")
                    .build();
        }

        try {
            oAuthService.handleCallback(code, userId);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/dashboard/settings?google=success")
                    .build();
        } catch (Exception e) {
            log.error("Google callback error", e);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/dashboard/settings?google=error")
                    .build();
        }
    }

    /**
     * Check connection status.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean connected = oAuthService.isConnected(userId);
        return ResponseEntity.ok(Map.of("data", Map.of("connected", connected)));
    }

    /**
     * List user's Google calendars.
     */
    @GetMapping("/calendars")
    public ResponseEntity<Map<String, Object>> listCalendars(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        var calendars = calendarService.listCalendars(userId);
        return ResponseEntity.ok(Map.of("data", calendars));
    }

    /**
     * Get events from all calendars within a time range.
     */
    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getEvents(
            Authentication authentication,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "Asia/Ho_Chi_Minh") String timezone) {

        String userId = (String) authentication.getPrincipal();
        var fromDt = DateTimeParser.parseClientDateTime(from);
        var toDt = DateTimeParser.parseClientDateTime(to);

        List<GoogleCalendarEventDto> events = calendarService.getAllEvents(userId, fromDt, toDt, timezone);
        return ResponseEntity.ok(Map.of(
                "data", events,
                "meta", Map.of("total", events.size())
        ));
    }

    /**
     * Disconnect Google Calendar.
     */
    @DeleteMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        oAuthService.disconnect(userId);
        return ResponseEntity.ok(Map.of("data", Map.of("message", "Đã ngắt kết nối Google Calendar")));
    }
}
