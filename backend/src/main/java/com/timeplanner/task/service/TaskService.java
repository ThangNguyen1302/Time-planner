package com.timeplanner.task.service;

import com.timeplanner.task.dto.CreateTaskRequest;
import com.timeplanner.task.dto.TaskResponse;
import com.timeplanner.task.dto.UpdateTaskRequest;
import com.timeplanner.task.entity.Task;
import com.timeplanner.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public Page<TaskResponse> getTasksByUser(String userId, String status, Pageable pageable) {
        Page<Task> page;
        if (status != null && !status.isBlank()) {
            page = taskRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            page = taskRepository.findByUserId(userId, pageable);
        }
        return page.map(TaskResponse::from);
    }

    public TaskResponse getTask(String userId, String taskId) {
        Task task = findAndVerifyOwnership(userId, taskId);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse createTask(String userId, CreateTaskRequest request) {
        Task task = Task.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .duration(request.getDuration())
                .deadline(request.getDeadline())
                .priority(request.getPriority())
                .status("pending")
                .color(request.getColor() != null ? request.getColor() : "#3B82F6")
                .build();
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(String userId, String taskId, UpdateTaskRequest request) {
        Task task = findAndVerifyOwnership(userId, taskId);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getDuration() != null) task.setDuration(request.getDuration());
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) {
            String newStatus = request.getStatus();
            task.setStatus(newStatus);
            if ("completed".equals(newStatus) && task.getCompletedAt() == null) {
                task.setCompletedAt(LocalDateTime.now());
            }
        }
        if (request.getColor() != null) task.setColor(request.getColor());

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(String userId, String taskId) {
        Task task = findAndVerifyOwnership(userId, taskId);
        taskRepository.delete(task);
    }

    @Transactional
    public TaskResponse updateStatus(String userId, String taskId, String status) {
        Task task = findAndVerifyOwnership(userId, taskId);
        task.setStatus(status);
        if ("completed".equals(status) && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    private Task findAndVerifyOwnership(String userId, String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task không tồn tại"));
        if (!task.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập task này");
        }
        return task;
    }
}
