package com.timeplanner.habit.repository;

import com.timeplanner.habit.entity.Habit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, String> {
    Page<Habit> findByUserId(String userId, Pageable pageable);
    List<Habit> findByUserIdAndIsActive(String userId, boolean isActive);
}
