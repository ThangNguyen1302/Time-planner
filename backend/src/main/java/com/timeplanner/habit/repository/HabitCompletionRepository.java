package com.timeplanner.habit.repository;

import com.timeplanner.habit.entity.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, String> {
    List<HabitCompletion> findByHabitIdOrderByCompletedAtDesc(String habitId);

    @Query("SELECT hc FROM HabitCompletion hc WHERE hc.habitId = :habitId AND hc.completedAt >= :from AND hc.completedAt < :to ORDER BY hc.completedAt DESC")
    List<HabitCompletion> findByHabitIdAndDateRange(@Param("habitId") String habitId,
                                                     @Param("from") LocalDateTime from,
                                                     @Param("to") LocalDateTime to);

    @Query("SELECT hc FROM HabitCompletion hc WHERE hc.userId = :userId AND hc.completedAt >= :from AND hc.completedAt < :to ORDER BY hc.completedAt DESC")
    List<HabitCompletion> findByUserIdAndDateRange(@Param("userId") String userId,
                                                    @Param("from") LocalDateTime from,
                                                    @Param("to") LocalDateTime to);
}
