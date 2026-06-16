package com.timeplanner.assistant.service;

import com.timeplanner.assistant.dto.AssistantActionDto;
import com.timeplanner.common.util.DateTimeParser;
import com.timeplanner.event.dto.CreateEventRequest;
import com.timeplanner.event.dto.EventResponse;
import com.timeplanner.event.dto.UpdateEventRequest;
import com.timeplanner.event.entity.Event;
import com.timeplanner.event.repository.EventRepository;
import com.timeplanner.event.service.EventService;
import com.timeplanner.task.dto.CreateTaskRequest;
import com.timeplanner.task.dto.TaskResponse;
import com.timeplanner.task.dto.UpdateTaskRequest;
import com.timeplanner.task.entity.Task;
import com.timeplanner.task.repository.TaskRepository;
import com.timeplanner.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantActionExecutor {

    private final TaskService taskService;
    private final EventService eventService;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;

    public AssistantActionDto execute(String userId, AssistantPlan.PlannedAction action) {
        if (action == null || action.getType() == null) {
            throw new IllegalArgumentException("Invalid assistant action");
        }

        return switch (action.getType()) {
            case "create_task" -> createTask(userId, action);
            case "create_event" -> createEvent(userId, action);
            case "update_task" -> updateTask(userId, action);
            case "update_event" -> updateEvent(userId, action);
            case "delete_task" -> deleteTask(userId, action);
            case "delete_event" -> deleteEvent(userId, action);
            default -> throw new IllegalArgumentException("Unsupported assistant action: " + action.getType());
        };
    }

    private AssistantActionDto createTask(String userId, AssistantPlan.PlannedAction action) {
        Map<String, Object> data = action.getData() == null ? Map.of() : action.getData();
        String title = text(data.get("title"));
        if (title.isBlank()) {
            throw new IllegalArgumentException("Task title is required");
        }

        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle(title);
        request.setDescription(text(data.get("description")));
        request.setDuration(number(data.get("duration"), 30));
        request.setDeadline(dateTime(data.get("deadline")));
        request.setPriority(number(data.get("priority"), 2));
        request.setColor(textOrDefault(data.get("color"), "#3B82F6"));

        TaskResponse response = taskService.createTask(userId, request);
        return AssistantActionDto.builder()
                .type("create_task")
                .data(new LinkedHashMap<>(data))
                .result(taskResult(response))
                .build();
    }

    private AssistantActionDto createEvent(String userId, AssistantPlan.PlannedAction action) {
        Map<String, Object> data = action.getData() == null ? Map.of() : action.getData();
        String title = text(data.get("title"));
        LocalDateTime startTime = dateTime(data.get("startTime"));
        LocalDateTime endTime = dateTime(data.get("endTime"));
        if (title.isBlank()) {
            throw new IllegalArgumentException("Event title is required");
        }
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Event startTime and endTime are required");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Event endTime must be after startTime");
        }

        CreateEventRequest request = new CreateEventRequest();
        request.setTitle(title);
        request.setDescription(text(data.get("description")));
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setRecurring(false);
        request.setColor(textOrDefault(data.get("color"), "#8B5CF6"));

        EventResponse response = eventService.createEvent(userId, request);
        return AssistantActionDto.builder()
                .type("create_event")
                .data(new LinkedHashMap<>(data))
                .result(eventResult(response))
                .build();
    }

    private AssistantActionDto updateTask(String userId, AssistantPlan.PlannedAction action) {
        Map<String, Object> data = action.getData() == null ? Map.of() : action.getData();
        Task task = resolveTask(userId, data);

        UpdateTaskRequest request = new UpdateTaskRequest();
        if (hasText(data, "title")) request.setTitle(text(data.get("title")));
        if (data.containsKey("description")) request.setDescription(text(data.get("description")));
        if (data.containsKey("duration")) request.setDuration(number(data.get("duration"), task.getDuration()));
        if (data.containsKey("deadline")) request.setDeadline(dateTime(data.get("deadline")));
        if (data.containsKey("priority")) request.setPriority(number(data.get("priority"), task.getPriority()));
        if (hasText(data, "status")) request.setStatus(normalizeStatus(text(data.get("status"))));
        if (hasText(data, "color")) request.setColor(text(data.get("color")));

        TaskResponse response = taskService.updateTask(userId, task.getId(), request);
        return AssistantActionDto.builder()
                .type("update_task")
                .data(new LinkedHashMap<>(data))
                .result(taskResult(response))
                .build();
    }

    private AssistantActionDto updateEvent(String userId, AssistantPlan.PlannedAction action) {
        Map<String, Object> data = action.getData() == null ? Map.of() : action.getData();
        Event event = resolveEvent(userId, data);
        LocalDateTime startTime = data.containsKey("startTime") ? dateTime(data.get("startTime")) : event.getStartTime();
        LocalDateTime endTime = data.containsKey("endTime") ? dateTime(data.get("endTime")) : event.getEndTime();
        if (startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        UpdateEventRequest request = new UpdateEventRequest();
        if (hasText(data, "title")) request.setTitle(text(data.get("title")));
        if (data.containsKey("description")) request.setDescription(text(data.get("description")));
        if (data.containsKey("startTime")) request.setStartTime(startTime);
        if (data.containsKey("endTime")) request.setEndTime(endTime);
        if (hasText(data, "color")) request.setColor(text(data.get("color")));

        EventResponse response = eventService.updateEvent(userId, event.getId(), request);
        return AssistantActionDto.builder()
                .type("update_event")
                .data(new LinkedHashMap<>(data))
                .result(eventResult(response))
                .build();
    }

    private AssistantActionDto deleteTask(String userId, AssistantPlan.PlannedAction action) {
        Map<String, Object> data = action.getData() == null ? Map.of() : action.getData();
        Task task = resolveTask(userId, data);
        Map<String, Object> result = Map.of("id", task.getId(), "title", task.getTitle());
        taskService.deleteTask(userId, task.getId());
        return AssistantActionDto.builder()
                .type("delete_task")
                .data(new LinkedHashMap<>(data))
                .result(result)
                .build();
    }

    private AssistantActionDto deleteEvent(String userId, AssistantPlan.PlannedAction action) {
        Map<String, Object> data = action.getData() == null ? Map.of() : action.getData();
        Event event = resolveEvent(userId, data);
        Map<String, Object> result = Map.of("id", event.getId(), "title", event.getTitle());
        eventService.deleteEvent(userId, event.getId());
        return AssistantActionDto.builder()
                .type("delete_event")
                .data(new LinkedHashMap<>(data))
                .result(result)
                .build();
    }

    private Task resolveTask(String userId, Map<String, Object> data) {
        String id = text(data.get("id"));
        if (!id.isBlank()) {
            return taskRepository.findById(id)
                    .filter(task -> userId.equals(task.getUserId()))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task cần sửa."));
        }

        String query = textOrDefault(data.get("targetTitle"), text(data.get("title")));
        if (query.isBlank()) {
            throw new IllegalArgumentException("Bạn muốn sửa task nào? Hãy nói tên task cần sửa.");
        }
        List<Task> matches = taskRepository.findTop20ByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(task -> titleMatches(task.getTitle(), query))
                .toList();
        if (matches.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy task \"" + query + "\".");
        }
        if (matches.size() > 1) {
            throw new IllegalArgumentException("Có nhiều task khớp \"" + query + "\". Hãy nói rõ hơn hoặc mở task cần sửa.");
        }
        return matches.getFirst();
    }

    private Event resolveEvent(String userId, Map<String, Object> data) {
        String id = text(data.get("id"));
        if (!id.isBlank()) {
            return eventRepository.findById(id)
                    .filter(event -> userId.equals(event.getUserId()))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy event cần sửa."));
        }

        String query = textOrDefault(data.get("targetTitle"), text(data.get("title")));
        if (query.isBlank()) {
            throw new IllegalArgumentException("Bạn muốn sửa event nào? Hãy nói tên event cần sửa.");
        }
        List<Event> matches = eventRepository.findTop20ByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(event -> titleMatches(event.getTitle(), query))
                .toList();
        if (matches.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy event \"" + query + "\".");
        }
        if (matches.size() > 1) {
            throw new IllegalArgumentException("Có nhiều event khớp \"" + query + "\". Hãy nói rõ hơn hoặc mở event cần sửa.");
        }
        return matches.getFirst();
    }

    private Map<String, Object> taskResult(TaskResponse response) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", response.getId());
        result.put("title", response.getTitle());
        result.put("duration", response.getDuration());
        result.put("deadline", response.getDeadline() == null ? null : response.getDeadline().toString());
        result.put("priority", response.getPriority());
        result.put("status", response.getStatus());
        return result;
    }

    private Map<String, Object> eventResult(EventResponse response) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", response.getId());
        result.put("title", response.getTitle());
        result.put("startTime", response.getStartTime() == null ? null : response.getStartTime().toString());
        result.put("endTime", response.getEndTime() == null ? null : response.getEndTime().toString());
        return result;
    }

    private String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String textOrDefault(Object value, String fallback) {
        String text = text(value);
        return text.isBlank() ? fallback : text;
    }

    private boolean hasText(Map<String, Object> data, String key) {
        return data.containsKey(key) && !text(data.get(key)).isBlank();
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        if (value == null) return fallback;
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private LocalDateTime dateTime(Object value) {
        String text = text(value);
        return text.isBlank() ? null : DateTimeParser.parseClientDateTime(text);
    }

    private boolean titleMatches(String title, String query) {
        String normalizedTitle = normalizeText(title);
        String normalizedQuery = normalizeText(query);
        return normalizedTitle.equals(normalizedQuery)
                || normalizedTitle.contains(normalizedQuery)
                || normalizedQuery.contains(normalizedTitle);
    }

    private String normalizeText(String value) {
        return java.text.Normalizer.normalize(text(value).toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeStatus(String status) {
        String normalized = normalizeText(status).replace(" ", "_");
        return switch (normalized) {
            case "xong", "done", "complete", "completed", "hoan_thanh" -> "completed";
            case "dang_lam", "in_progress", "doing" -> "in_progress";
            case "bo_qua", "skipped", "skip" -> "skipped";
            case "qua_han", "overdue" -> "overdue";
            default -> "pending";
        };
    }
}
