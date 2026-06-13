package com.timeplanner.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantActionDto {
    private String type;
    private Map<String, Object> data;
    private Map<String, Object> result;
}
