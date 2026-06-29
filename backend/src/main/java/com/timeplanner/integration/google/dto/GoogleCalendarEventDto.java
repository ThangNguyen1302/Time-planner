package com.timeplanner.integration.google.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCalendarEventDto implements Serializable {
    private String id;
    private String summary;
    private String description;
    private String startTime;
    private String endTime;
    private boolean allDay;
    private String calendarId;
}
