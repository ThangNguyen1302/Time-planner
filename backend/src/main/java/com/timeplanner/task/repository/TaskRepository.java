package com.timeplanner.task.repository;

import com.timeplanner.task.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {
    Page<Task> findByUserId(String userId, Pageable pageable);
    Page<Task> findByUserIdAndStatus(String userId, String status, Pageable pageable);
    List<Task> findByUserIdAndStatusNot(String userId, String status);
    List<Task> findTop20ByUserIdOrderByUpdatedAtDesc(String userId);
}
