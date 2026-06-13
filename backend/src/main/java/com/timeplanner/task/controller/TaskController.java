package com.timeplanner.task.controller;

import com.timeplanner.task.dto.CreateTaskRequest;
import com.timeplanner.task.dto.TaskResponse;
import com.timeplanner.task.dto.UpdateTaskRequest;
import com.timeplanner.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTasks(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        String userId = (String) authentication.getPrincipal();
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<TaskResponse> result = taskService.getTasksByUser(userId, status, PageRequest.of(page, size, sort));

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
    public ResponseEntity<Map<String, Object>> getTask(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", taskService.getTask(userId, id)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTask(
            Authentication authentication,
            @Valid @RequestBody CreateTaskRequest request) {
        String userId = (String) authentication.getPrincipal();
        TaskResponse response = taskService.createTask(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateTaskRequest request) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("data", taskService.updateTask(userId, id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = (String) authentication.getPrincipal();
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", Map.of("code", "INVALID_REQUEST", "message", "status is required")
            ));
        }
        return ResponseEntity.ok(Map.of("data", taskService.updateStatus(userId, id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(Authentication authentication, @PathVariable String id) {
        String userId = (String) authentication.getPrincipal();
        taskService.deleteTask(userId, id);
        return ResponseEntity.noContent().build();
    }
}
