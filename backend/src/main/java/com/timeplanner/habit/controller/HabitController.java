package com.timeplanner.habit.controller;

import com.timeplanner.common.util.DateTimeParser;
import com.timeplanner.habit.dto.*;
import com.timeplanner.habit.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHabits(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userId = (String) authentication.getPrincipal();
        Page<HabitResponse> result = habitService.getHabitsByUser(
                userId, PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ResponseEntity.ok(Map.of(
                "data", result.getContent(),
                "meta", Map.of(
                        "page", result.getNumber(),
                        "size", result.getSize(),
                        "totalElements", result.getTotalElements(),
                        "totalPages", result.getTotalPages()
                )
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getHabit(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", habitService.getHabit(userId, id)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createHabit(
            Authentication authentication,
            @Valid @RequestBody CreateHabitRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", habitService.createHabit(userId, request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateHabit(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateHabitRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", habitService.updateHabit(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        habitService.deleteHabit(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeHabit(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String userId = (String) authentication.getPrincipal();
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("data", habitService.completeHabit(userId, id, notes)));
    }

    @GetMapping("/{id}/completions")
    public ResponseEntity<Map<String, Object>> getCompletions(
            Authentication authentication,
            @PathVariable String id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        String userId = (String) authentication.getPrincipal();
        var fromDt = from != null ? DateTimeParser.parseClientDateTime(from) : null;
        var toDt = to != null ? DateTimeParser.parseClientDateTime(to) : null;
        List<HabitCompletionResponse> completions = habitService.getCompletions(userId, id, fromDt, toDt);
        return ResponseEntity.ok(Map.of("data", completions, "meta", Map.of("total", completions.size())));
    }
}
