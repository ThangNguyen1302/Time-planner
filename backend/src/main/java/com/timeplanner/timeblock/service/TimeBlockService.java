package com.timeplanner.timeblock.service;

import com.timeplanner.timeblock.dto.CreateTimeBlockRequest;
import com.timeplanner.timeblock.dto.TimeBlockResponse;
import com.timeplanner.timeblock.dto.UpdateTimeBlockRequest;
import com.timeplanner.timeblock.entity.TimeBlock;
import com.timeplanner.timeblock.repository.TimeBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeBlockService {

    private final TimeBlockRepository timeBlockRepository;

    public List<TimeBlockResponse> getTimeBlocksInRange(String userId, LocalDateTime from, LocalDateTime to) {
        return timeBlockRepository.findByUserIdAndTimeRange(userId, from, to)
                .stream().map(TimeBlockResponse::from).toList();
    }

    public List<TimeBlockResponse> getAllTimeBlocks(String userId) {
        return timeBlockRepository.findByUserIdOrderByStartTimeDesc(userId)
                .stream().map(TimeBlockResponse::from).toList();
    }

    public TimeBlockResponse getTimeBlock(String userId, String blockId) {
        return TimeBlockResponse.from(findAndVerifyOwnership(userId, blockId));
    }

    @Transactional
    public TimeBlockResponse createTimeBlock(String userId, CreateTimeBlockRequest request) {
        TimeBlock block = TimeBlock.builder()
                .userId(userId)
                .title(request.getTitle())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .blockType(request.getBlockType())
                .sourceId(request.getSourceId())
                .status("scheduled")
                .color(request.getColor() != null ? request.getColor() : "#6366F1")
                .isManualOverride(request.isManualOverride())
                .build();
        return TimeBlockResponse.from(timeBlockRepository.save(block));
    }

    @Transactional
    public TimeBlockResponse updateTimeBlock(String userId, String blockId, UpdateTimeBlockRequest request) {
        TimeBlock block = findAndVerifyOwnership(userId, blockId);

        if (request.getTitle() != null) block.setTitle(request.getTitle());
        if (request.getStartTime() != null) block.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) block.setEndTime(request.getEndTime());
        if (request.getBlockType() != null) block.setBlockType(request.getBlockType());
        if (request.getSourceId() != null) block.setSourceId(request.getSourceId());
        if (request.getStatus() != null) block.setStatus(request.getStatus());
        if (request.getColor() != null) block.setColor(request.getColor());
        if (request.getIsManualOverride() != null) block.setManualOverride(request.getIsManualOverride());

        return TimeBlockResponse.from(timeBlockRepository.save(block));
    }

    @Transactional
    public void deleteTimeBlock(String userId, String blockId) {
        TimeBlock block = findAndVerifyOwnership(userId, blockId);
        timeBlockRepository.delete(block);
    }

    private TimeBlock findAndVerifyOwnership(String userId, String blockId) {
        TimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new IllegalArgumentException("Time block không tồn tại"));
        if (!block.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập time block này");
        }
        return block;
    }
}
