package com.timeplanner.timeblock.repository;

import com.timeplanner.timeblock.entity.TimeBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TimeBlockRepository extends JpaRepository<TimeBlock, String> {

    @Query("SELECT tb FROM TimeBlock tb WHERE tb.userId = :userId AND tb.startTime >= :from AND tb.startTime < :to ORDER BY tb.startTime")
    List<TimeBlock> findByUserIdAndTimeRange(@Param("userId") String userId,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    List<TimeBlock> findByUserIdOrderByStartTimeDesc(String userId);
}
