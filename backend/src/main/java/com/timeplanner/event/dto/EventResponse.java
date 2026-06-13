package com.timeplanner.event.dto;

import com.timeplanner.event.entity.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private String id;
    private String userId;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean isRecurring;
    private String recurrenceRule;
    private String color;
    private String externalId;
    private String createdAt;
    private String updatedAt;

    public static EventResponse from(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .userId(event.getUserId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .isRecurring(event.isRecurring())
                .recurrenceRule(event.getRecurrenceRule())
                .color(event.getColor())
                .externalId(event.getExternalId())
                .createdAt(event.getCreatedAt() != null ? event.getCreatedAt().toString() : null)
                .updatedAt(event.getUpdatedAt() != null ? event.getUpdatedAt().toString() : null)
                .build();
    }
}
