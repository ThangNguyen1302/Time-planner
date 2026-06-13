package com.timeplanner.timeblock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTimeBlockRequest {
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String blockType;
    private String sourceId;
    private String status;
    private String color;
    private Boolean isManualOverride;
}
