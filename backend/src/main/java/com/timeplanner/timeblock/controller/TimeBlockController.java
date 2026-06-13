package com.timeplanner.timeblock.controller;

import com.timeplanner.common.util.DateTimeParser;
import com.timeplanner.timeblock.dto.CreateTimeBlockRequest;
import com.timeplanner.timeblock.dto.TimeBlockResponse;
import com.timeplanner.timeblock.dto.UpdateTimeBlockRequest;
import com.timeplanner.timeblock.service.TimeBlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/time-blocks")
@RequiredArgsConstructor
public class TimeBlockController {

    private final TimeBlockService timeBlockService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTimeBlocks(
            Authentication authentication,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        String userId = (String) authentication.getPrincipal();
        List<TimeBlockResponse> blocks;

        if (from != null && to != null) {
            blocks = timeBlockService.getTimeBlocksInRange(
                    userId, DateTimeParser.parseClientDateTime(from), DateTimeParser.parseClientDateTime(to));
        } else {
            blocks = timeBlockService.getAllTimeBlocks(userId);
        }

        return ResponseEntity.ok(Map.of("data", blocks, "meta", Map.of("total", blocks.size())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTimeBlock(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", timeBlockService.getTimeBlock(userId, id)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTimeBlock(
            Authentication authentication,
            @Valid @RequestBody CreateTimeBlockRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("data", timeBlockService.createTimeBlock(userId, request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTimeBlock(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateTimeBlockRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", timeBlockService.updateTimeBlock(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimeBlock(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        timeBlockService.deleteTimeBlock(userId, id);
        return ResponseEntity.noContent().build();
    }
}
