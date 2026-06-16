package com.timeplanner.assistant.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AssistantRuleParserTest {

    private final AssistantRuleParser parser = new AssistantRuleParser();

    @Test
    void supportsTaskCreateUpdateAndDelete() {
        assertAction("Tạo task học backend deadline mai 17h", "create_task");
        assertAction("Sửa task học backend thành học Spring", "update_task");
        assertAction("Xóa task học backend", "delete_task");
    }

    @Test
    void supportsEventCreateUpdateAndDelete() {
        assertAction("Tạo event họp nhóm ngày mai 9h đến 10h", "create_event");
        assertAction("Sửa lịch họp nhóm sang ngày mai 10h đến 11h", "update_event");
        assertAction("Xóa lịch họp nhóm", "delete_event");
    }

    @Test
    void extractsTaskCreationDetails() {
        AssistantPlan plan = parser.parse("Tạo task nộp báo cáo deadline ngày mai 17h, 45 phút, ưu tiên gấp");

        Map<String, Object> data = singleAction(plan, "create_task").getData();
        assertThat(data)
                .containsEntry("title", "nop bao cao")
                .containsEntry("duration", 45)
                .containsEntry("priority", 5)
                .containsEntry("deadline", LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(17, 0)).toString());
    }

    @Test
    void extractsTaskUpdateDetails() {
        AssistantPlan renamePlan = parser.parse("Sửa task học backend thành học Spring");
        assertThat(singleAction(renamePlan, "update_task").getData())
                .containsEntry("targetTitle", "hoc backend")
                .containsEntry("title", "hoc spring");

        AssistantPlan completionPlan = parser.parse("Đánh dấu task nộp báo cáo hoàn thành");
        assertThat(singleAction(completionPlan, "update_task").getData())
                .containsEntry("targetTitle", "nop bao cao")
                .containsEntry("status", "completed");
    }

    @Test
    void extractsEventCreationAndUpdateTimes() {
        AssistantPlan createPlan = parser.parse("Tạo event họp nhóm ngày mai 9h đến 10h");
        assertThat(singleAction(createPlan, "create_event").getData())
                .containsEntry("title", "hop nhom")
                .containsEntry("startTime", LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(9, 0)).toString())
                .containsEntry("endTime", LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(10, 0)).toString());

        AssistantPlan updatePlan = parser.parse("Sửa lịch họp nhóm sang ngày mai 14h đến 15h30");
        assertThat(singleAction(updatePlan, "update_event").getData())
                .containsEntry("targetTitle", "hop nhom")
                .containsEntry("startTime", LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(14, 0)).toString())
                .containsEntry("endTime", LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 30)).toString());
    }

    @Test
    void asksForMissingRequiredInformation() {
        assertThat(parser.parse("Tạo task").actionsOrEmpty()).isEmpty();
        assertThat(parser.parse("Tạo event họp khách hàng").actionsOrEmpty()).isEmpty();
        assertThat(parser.parse("Xóa task").actionsOrEmpty()).isEmpty();
        assertThat(parser.parse("Sửa lịch họp nhóm").actionsOrEmpty()).isEmpty();
    }

    @Test
    void supportsEnglishDeleteCommands() {
        assertThat(singleAction(parser.parse("Delete task weekly report"), "delete_task").getData())
                .containsEntry("targetTitle", "weekly report");
        assertThat(singleAction(parser.parse("Remove event team meeting"), "delete_event").getData())
                .containsEntry("targetTitle", "team meeting");
    }

    private void assertAction(String message, String expectedType) {
        singleAction(parser.parse(message), expectedType);
    }

    private AssistantPlan.PlannedAction singleAction(AssistantPlan plan, String expectedType) {
        assertThat(plan.actionsOrEmpty()).hasSize(1);
        assertThat(plan.actionsOrEmpty().getFirst().getType()).isEqualTo(expectedType);
        return plan.actionsOrEmpty().getFirst();
    }
}
