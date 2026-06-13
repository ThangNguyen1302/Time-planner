package com.timeplanner.event.controller;

import com.timeplanner.common.util.DateTimeParser;
import com.timeplanner.event.dto.CreateEventRequest;
import com.timeplanner.event.dto.EventResponse;
import com.timeplanner.event.dto.UpdateEventRequest;
import com.timeplanner.event.service.EventService;
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
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEvents(
            Authentication authentication,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userId = (String) authentication.getPrincipal();

        if (from != null && to != null) {
            List<EventResponse> events = eventService.getEventsInRange(
                    userId, DateTimeParser.parseClientDateTime(from), DateTimeParser.parseClientDateTime(to));
            return ResponseEntity.ok(Map.of("data", events, "meta", Map.of("total", events.size())));
        }

        Page<EventResponse> result = eventService.getEventsByUser(
                userId, PageRequest.of(page, size, Sort.by("startTime").descending()));
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
    public ResponseEntity<Map<String, Object>> getEvent(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", eventService.getEvent(userId, id)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEvent(
            Authentication authentication,
            @Valid @RequestBody CreateEventRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", eventService.createEvent(userId, request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEvent(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateEventRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", eventService.updateEvent(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        eventService.deleteEvent(userId, id);
        return ResponseEntity.noContent().build();
    }
}
