package com.timeplanner.event.repository;

import com.timeplanner.event.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, String> {
    Page<Event> findByUserId(String userId, Pageable pageable);
    List<Event> findTop20ByUserIdOrderByUpdatedAtDesc(String userId);

    @Query("SELECT e FROM Event e WHERE e.userId = :userId AND e.startTime >= :from AND e.startTime < :to ORDER BY e.startTime")
    List<Event> findByUserIdAndTimeRange(@Param("userId") String userId,
                                         @Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);
}
