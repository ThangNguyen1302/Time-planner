package com.timeplanner.timeblock.dto;

import com.timeplanner.timeblock.entity.TimeBlock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeBlockResponse {
    private String id;
    private String userId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String blockType;
    private String sourceId;
    private String status;
    private String color;
    private boolean isManualOverride;
    private String createdAt;
    private String updatedAt;

    public static TimeBlockResponse from(TimeBlock tb) {
        return TimeBlockResponse.builder()
                .id(tb.getId())
                .userId(tb.getUserId())
                .title(tb.getTitle())
                .startTime(tb.getStartTime())
                .endTime(tb.getEndTime())
                .blockType(tb.getBlockType())
                .sourceId(tb.getSourceId())
                .status(tb.getStatus())
                .color(tb.getColor())
                .isManualOverride(tb.isManualOverride())
                .createdAt(tb.getCreatedAt() != null ? tb.getCreatedAt().toString() : null)
                .updatedAt(tb.getUpdatedAt() != null ? tb.getUpdatedAt().toString() : null)
                .build();
    }
}
