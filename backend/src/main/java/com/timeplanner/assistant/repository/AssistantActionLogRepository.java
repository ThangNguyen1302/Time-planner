package com.timeplanner.assistant.repository;

import com.timeplanner.assistant.entity.AssistantActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssistantActionLogRepository extends JpaRepository<AssistantActionLog, String> {
}
