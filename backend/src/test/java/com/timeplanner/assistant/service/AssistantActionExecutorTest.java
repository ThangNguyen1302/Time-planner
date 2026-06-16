package com.timeplanner.assistant.service;

import com.timeplanner.assistant.dto.AssistantActionDto;
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
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssistantActionExecutorTest {

    private final TaskService taskService = mock(TaskService.class);
    private final EventService eventService = mock(EventService.class);
    private final TaskRepository taskRepository = mock(TaskRepository.class);
    private final EventRepository eventRepository = mock(EventRepository.class);
    private final AssistantActionExecutor executor =
            new AssistantActionExecutor(taskService, eventService, taskRepository, eventRepository);

    @Test
    void createsTaskWithExpectedFields() {
        LocalDateTime deadline = LocalDateTime.of(2026, 6, 16, 17, 0);
        when(taskService.createTask(eq("user-1"), any(CreateTaskRequest.class)))
                .thenReturn(TaskResponse.builder()
                        .id("task-1")
                        .title("Nộp báo cáo")
                        .duration(45)
                        .deadline(deadline)
                        .priority(5)
                        .status("pending")
                        .build());

        AssistantActionDto result = executor.execute("user-1", AssistantPlan.PlannedAction.builder()
                .type("create_task")
                .data(Map.of(
                        "title", "Nộp báo cáo",
                        "duration", 45,
                        "deadline", deadline.toString(),
                        "priority", 5
                ))
                .build());

        ArgumentCaptor<CreateTaskRequest> request = ArgumentCaptor.forClass(CreateTaskRequest.class);
        verify(taskService).createTask(eq("user-1"), request.capture());
        assertThat(request.getValue().getTitle()).isEqualTo("Nộp báo cáo");
        assertThat(request.getValue().getDuration()).isEqualTo(45);
        assertThat(request.getValue().getDeadline()).isEqualTo(deadline);
        assertThat(request.getValue().getPriority()).isEqualTo(5);
        assertThat(result.getResult()).containsEntry("id", "task-1");
    }

    @Test
    void createsEventWithExpectedTimeRange() {
        LocalDateTime start = LocalDateTime.of(2026, 6, 16, 9, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 16, 10, 0);
        when(eventService.createEvent(eq("user-1"), any(CreateEventRequest.class)))
                .thenReturn(EventResponse.builder()
                        .id("event-1")
                        .title("Họp nhóm")
                        .startTime(start)
                        .endTime(end)
                        .build());

        AssistantActionDto result = executor.execute("user-1", AssistantPlan.PlannedAction.builder()
                .type("create_event")
                .data(Map.of(
                        "title", "Họp nhóm",
                        "startTime", start.toString(),
                        "endTime", end.toString()
                ))
                .build());

        ArgumentCaptor<CreateEventRequest> request = ArgumentCaptor.forClass(CreateEventRequest.class);
        verify(eventService).createEvent(eq("user-1"), request.capture());
        assertThat(request.getValue().getStartTime()).isEqualTo(start);
        assertThat(request.getValue().getEndTime()).isEqualTo(end);
        assertThat(result.getResult()).containsEntry("id", "event-1");
    }

    @Test
    void updatesTaskResolvedByTitle() {
        Task task = Task.builder()
                .id("task-1")
                .userId("user-1")
                .title("Học backend")
                .duration(30)
                .priority(2)
                .build();
        when(taskRepository.findTop20ByUserIdOrderByUpdatedAtDesc("user-1")).thenReturn(List.of(task));
        when(taskService.updateTask(eq("user-1"), eq("task-1"), any(UpdateTaskRequest.class)))
                .thenReturn(TaskResponse.builder()
                        .id("task-1")
                        .title("Học Spring")
                        .duration(30)
                        .priority(2)
                        .status("completed")
                        .build());

        AssistantActionDto result = executor.execute("user-1", AssistantPlan.PlannedAction.builder()
                .type("update_task")
                .data(Map.of(
                        "targetTitle", "hoc backend",
                        "title", "Học Spring",
                        "status", "hoàn thành"
                ))
                .build());

        ArgumentCaptor<UpdateTaskRequest> request = ArgumentCaptor.forClass(UpdateTaskRequest.class);
        verify(taskService).updateTask(eq("user-1"), eq("task-1"), request.capture());
        assertThat(request.getValue().getTitle()).isEqualTo("Học Spring");
        assertThat(request.getValue().getStatus()).isEqualTo("completed");
        assertThat(result.getResult()).containsEntry("title", "Học Spring");
    }

    @Test
    void updatesEventResolvedById() {
        LocalDateTime oldStart = LocalDateTime.of(2026, 6, 16, 9, 0);
        LocalDateTime oldEnd = LocalDateTime.of(2026, 6, 16, 10, 0);
        LocalDateTime newStart = LocalDateTime.of(2026, 6, 16, 14, 0);
        LocalDateTime newEnd = LocalDateTime.of(2026, 6, 16, 15, 0);
        Event event = Event.builder()
                .id("event-1")
                .userId("user-1")
                .title("Họp nhóm")
                .startTime(oldStart)
                .endTime(oldEnd)
                .build();
        when(eventRepository.findById("event-1")).thenReturn(Optional.of(event));
        when(eventService.updateEvent(eq("user-1"), eq("event-1"), any(UpdateEventRequest.class)))
                .thenReturn(EventResponse.builder()
                        .id("event-1")
                        .title("Họp nhóm")
                        .startTime(newStart)
                        .endTime(newEnd)
                        .build());

        executor.execute("user-1", AssistantPlan.PlannedAction.builder()
                .type("update_event")
                .data(Map.of(
                        "id", "event-1",
                        "startTime", newStart.toString(),
                        "endTime", newEnd.toString()
                ))
                .build());

        ArgumentCaptor<UpdateEventRequest> request = ArgumentCaptor.forClass(UpdateEventRequest.class);
        verify(eventService).updateEvent(eq("user-1"), eq("event-1"), request.capture());
        assertThat(request.getValue().getStartTime()).isEqualTo(newStart);
        assertThat(request.getValue().getEndTime()).isEqualTo(newEnd);
    }

    @Test
    void deletesTaskResolvedByTitle() {
        Task task = Task.builder().id("task-1").userId("user-1").title("Học backend").build();
        when(taskRepository.findTop20ByUserIdOrderByUpdatedAtDesc("user-1")).thenReturn(java.util.List.of(task));

        AssistantActionDto result = executor.execute("user-1", action("delete_task", "học backend"));

        verify(taskService).deleteTask("user-1", "task-1");
        assertThat(result.getResult()).containsEntry("title", "Học backend");
    }

    @Test
    void deletesEventResolvedByTitle() {
        Event event = Event.builder().id("event-1").userId("user-1").title("Họp nhóm").build();
        when(eventRepository.findTop20ByUserIdOrderByUpdatedAtDesc("user-1")).thenReturn(java.util.List.of(event));

        AssistantActionDto result = executor.execute("user-1", action("delete_event", "họp nhóm"));

        verify(eventService).deleteEvent("user-1", "event-1");
        assertThat(result.getResult()).containsEntry("title", "Họp nhóm");
    }

    @Test
    void rejectsAmbiguousTaskTitle() {
        Task first = Task.builder().id("task-1").userId("user-1").title("Học backend cơ bản").build();
        Task second = Task.builder().id("task-2").userId("user-1").title("Học backend nâng cao").build();
        when(taskRepository.findTop20ByUserIdOrderByUpdatedAtDesc("user-1")).thenReturn(List.of(first, second));

        assertThatThrownBy(() -> executor.execute("user-1", action("delete_task", "học backend")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Có nhiều task khớp");
        verify(taskService, never()).deleteTask(any(), any());
    }

    @Test
    void rejectsMissingEvent() {
        when(eventRepository.findTop20ByUserIdOrderByUpdatedAtDesc("user-1")).thenReturn(List.of());

        assertThatThrownBy(() -> executor.execute("user-1", action("delete_event", "không tồn tại")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy event");
        verify(eventService, never()).deleteEvent(any(), any());
    }

    @Test
    void rejectsEventWithInvalidTimeRange() {
        LocalDateTime start = LocalDateTime.of(2026, 6, 16, 10, 0);

        assertThatThrownBy(() -> executor.execute("user-1", AssistantPlan.PlannedAction.builder()
                .type("create_event")
                .data(Map.of(
                        "title", "Lịch lỗi",
                        "startTime", start.toString(),
                        "endTime", start.minusHours(1).toString()
                ))
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must be after");
        verify(eventService, never()).createEvent(any(), any());
    }

    @Test
    void rejectsItemOwnedByAnotherUserWhenResolvingById() {
        Task task = Task.builder().id("task-1").userId("user-2").title("Task riêng").build();
        when(taskRepository.findById("task-1")).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> executor.execute("user-1", AssistantPlan.PlannedAction.builder()
                .type("delete_task")
                .data(Map.of("id", "task-1"))
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy task");
        verify(taskService, never()).deleteTask(any(), any());
    }

    private AssistantPlan.PlannedAction action(String type, String targetTitle) {
        return AssistantPlan.PlannedAction.builder()
                .type(type)
                .data(Map.of("targetTitle", targetTitle))
                .build();
    }
}
