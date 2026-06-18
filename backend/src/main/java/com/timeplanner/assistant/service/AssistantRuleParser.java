package com.timeplanner.assistant.service;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AssistantRuleParser {

    private static final Pattern MINUTES_PATTERN = Pattern.compile("(\\d+)\\s*(phut|minute|minutes|min)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TIME_PATTERN = Pattern.compile("(\\d{1,2})(?:(?::|h)(\\d{2}))?\\s*(h|gio|am|pm)?", Pattern.CASE_INSENSITIVE);

    public AssistantPlan parse(String message, List<String> history) {
        String continuation = continuationMessage(message, history);
        if (continuation != null && !continuation.isBlank()) {
            return parse(continuation);
        }
        return parse(message);
    }

    public AssistantPlan parse(String message) {
        String normalized = normalize(message);
        boolean wantsTask = containsAny(normalized, "task", "viec", "todo", "cong viec");
        boolean wantsEvent = containsAny(normalized, "event", "su kien", "lich", "hop");
        boolean createIntent = containsAny(normalized, "tao", "them", "dat", "len");
        boolean updateIntent = containsAny(normalized, "sua", "doi", "cap nhat", "chinh", "chuyen", "danh dau", "doi lich", "doi gio", "doi deadline", "doi han");
        boolean deleteIntent = containsAny(normalized, "xoa", "huy", "remove", "delete");

        if (deleteIntent && (wantsTask || wantsEvent)) {
            if (wantsEvent && !wantsTask) {
                return parseEventDelete(message);
            }
            return parseTaskDelete(message);
        }

        if (updateIntent && (wantsTask || wantsEvent)) {
            if (wantsEvent && !wantsTask) {
                return parseEventUpdate(message, normalized);
            }
            return parseTaskUpdate(message, normalized);
        }

        if (!createIntent || (!wantsTask && !wantsEvent)) {
            return AssistantPlan.ask(
                    "Bạn muốn mình tạo hay sửa task/event nào? Hãy nói rõ tiêu đề và thời gian nếu có.",
                    "Tạo task mới",
                    "Tạo event mới",
                    "Sửa lịch họp"
            );
        }

        if (wantsEvent && !wantsTask) {
            return parseEvent(message, normalized);
        }
        return parseTask(message, normalized);
    }

    private AssistantPlan parseTask(String original, String normalized) {
        String title = cleanupTitle(original, List.of("tao task", "them task", "task"));
        if (title.isBlank()) {
            return AssistantPlan.ask("Task này tên là gì?", "Học backend", "Nộp báo cáo");
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", title);
        data.put("duration", extractDuration(normalized));
        data.put("priority", extractPriority(normalized));
        LocalDateTime deadline = extractDateTime(normalized);
        if (deadline != null) data.put("deadline", deadline.toString());

        return AssistantPlan.builder()
                .message("Mình sẽ tạo task \"" + title + "\" cho bạn.")
                .mood("happy")
                .quickReplies(List.of("Xem tasks", "Tạo thêm task"))
                .actions(List.of(AssistantPlan.PlannedAction.builder()
                        .type("create_task")
                        .data(data)
                        .build()))
                .build();
    }

    private AssistantPlan parseTaskUpdate(String original, String normalized) {
        boolean renameIntent = isRenameUpdate(normalized);
        String targetTitle = renameIntent
                ? cleanupRenameTarget(original)
                : cleanupUpdateTarget(original, List.of("sua task", "doi task", "cap nhat task", "chinh task", "task"));
        if (targetTitle.isBlank()) {
            return AssistantPlan.ask("Bạn muốn sửa task nào?", "Sửa task Học backend");
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("targetTitle", targetTitle);

        String newTitle = renameIntent ? extractRenameTitle(original) : "";
        if (!newTitle.isBlank()) data.put("title", newTitle);
        if (isDurationUpdate(normalized)) data.put("duration", extractDuration(normalized));
        if (containsAny(normalized, "gap", "quan trong", "urgent", "thap", "low")) {
            data.put("priority", extractPriority(normalized));
        }
        if (!renameIntent) {
            LocalDateTime deadline = extractDateTime(normalized);
            if (deadline != null) data.put("deadline", deadline.toString());
            String status = extractStatus(normalized);
            if (!status.isBlank()) data.put("status", status);
        }

        if (data.size() == 1) {
            return AssistantPlan.ask("Bạn muốn đổi thông tin nào của task \"" + targetTitle + "\"?", "Đổi deadline sang mai 17h", "Đánh dấu hoàn thành");
        }

        return AssistantPlan.builder()
                .message("Mình sẽ cập nhật task \"" + targetTitle + "\".")
                .mood("happy")
                .quickReplies(List.of("Xem tasks", "Sửa task khác"))
                .actions(List.of(AssistantPlan.PlannedAction.builder()
                        .type("update_task")
                        .data(data)
                        .build()))
                .build();
    }

    private AssistantPlan parseEventUpdate(String original, String normalized) {
        boolean renameIntent = isRenameUpdate(normalized);
        String targetTitle = renameIntent
                ? cleanupRenameTarget(original)
                : cleanupUpdateTarget(original, List.of("sua event", "doi event", "cap nhat event", "doi gio event", "sua lich", "doi lich", "chinh lich", "doi gio lich", "event", "lich"));
        if (targetTitle.isBlank()) {
            return AssistantPlan.ask("Bạn muốn sửa event nào?", "Sửa lịch họp nhóm");
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("targetTitle", targetTitle);

        String newTitle = renameIntent ? extractRenameTitle(original) : "";
        if (!newTitle.isBlank()) data.put("title", newTitle);
        if (!renameIntent) {
            TimeRange timeRange = extractTimeRange(normalized);
            if (timeRange.start() != null) {
                data.put("startTime", timeRange.start().toString());
                data.put("endTime", timeRange.end().toString());
            }
        }

        if (data.size() == 1) {
            return AssistantPlan.ask("Bạn muốn đổi thông tin nào của event \"" + targetTitle + "\"?", "Đổi sang mai 9h đến 10h", "Đổi tên event");
        }

        return AssistantPlan.builder()
                .message("Mình sẽ cập nhật event \"" + targetTitle + "\".")
                .mood("happy")
                .quickReplies(List.of("Xem lịch", "Sửa event khác"))
                .actions(List.of(AssistantPlan.PlannedAction.builder()
                        .type("update_event")
                        .data(data)
                        .build()))
                .build();
    }

    private AssistantPlan parseEvent(String original, String normalized) {
        String title = cleanupTitle(original, List.of("tao event", "them event", "tao lich", "dat lich", "event", "lich"));
        if (title.isBlank()) {
            return AssistantPlan.ask("Event này tên là gì và diễn ra khi nào?", "Họp nhóm mai 9h đến 10h");
        }

        TimeRange timeRange = extractTimeRange(normalized);
        if (timeRange.start() == null) {
            return AssistantPlan.ask("Event \"" + title + "\" bắt đầu lúc nào?", "Mai 9h", "Hôm nay 15h");
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", title);
        data.put("startTime", timeRange.start().toString());
        data.put("endTime", timeRange.end().toString());

        return AssistantPlan.builder()
                .message("Mình sẽ tạo event \"" + title + "\" vào " + timeRange.start() + ".")
                .mood("happy")
                .quickReplies(List.of("Xem lịch", "Tạo thêm event"))
                .actions(List.of(AssistantPlan.PlannedAction.builder()
                        .type("create_event")
                        .data(data)
                        .build()))
                .build();
    }

    private AssistantPlan parseTaskDelete(String original) {
        String targetTitle = cleanupDeleteTarget(original);
        if (targetTitle.isBlank()) {
            return AssistantPlan.ask("Bạn muốn xóa task nào?", "Xóa task Học backend");
        }

        return AssistantPlan.builder()
                .message("Mình sẽ xóa task \"" + targetTitle + "\".")
                .mood("serious")
                .quickReplies(List.of("Xem tasks"))
                .actions(List.of(AssistantPlan.PlannedAction.builder()
                        .type("delete_task")
                        .data(Map.of("targetTitle", targetTitle))
                        .build()))
                .build();
    }

    private AssistantPlan parseEventDelete(String original) {
        String targetTitle = cleanupDeleteTarget(original);
        if (targetTitle.isBlank()) {
            return AssistantPlan.ask("Bạn muốn xóa event nào?", "Xóa lịch họp nhóm");
        }

        return AssistantPlan.builder()
                .message("Mình sẽ xóa event \"" + targetTitle + "\".")
                .mood("serious")
                .quickReplies(List.of("Xem lịch"))
                .actions(List.of(AssistantPlan.PlannedAction.builder()
                        .type("delete_event")
                        .data(Map.of("targetTitle", targetTitle))
                        .build()))
                .build();
    }

    private String continuationMessage(String message, List<String> history) {
        if (history == null || history.isEmpty()) return null;

        String normalized = normalize(message);
        boolean mentionsObject = containsAny(normalized, "task", "viec", "todo", "cong viec", "event", "su kien", "lich", "hop");
        boolean explicitNewRequest = containsAny(normalized, "tao", "them", "dat", "len", "xoa", "huy", "remove", "delete")
                || (mentionsObject && containsAny(normalized, "sua", "doi", "cap nhat", "chinh", "chuyen", "danh dau"));
        if (explicitNewRequest) {
            return null;
        }

        String lastAssistant = lastContent(history, "assistant");
        if (lastAssistant.isBlank() || !lastAssistant.contains("?")) return null;

        String assistant = normalize(lastAssistant);
        if (containsAny(assistant, "task nay ten la gi")) {
            return "Tạo task " + message;
        }
        if (containsAny(assistant, "event nay ten la gi")) {
            return "Tạo event " + message;
        }
        if (containsAny(assistant, "bat dau luc nao")) {
            String title = quotedTitle(lastAssistant);
            if (title.isBlank()) {
                title = cleanupTitle(lastContent(history, "user"), List.of("tao event", "them event", "tao lich", "dat lich", "event", "lich"));
            }
            if (!title.isBlank()) {
                return "Tạo event " + title + " " + message;
            }
        }
        if (containsAny(assistant, "ban muon xoa task nao")) {
            return "Xóa task " + message;
        }
        if (containsAny(assistant, "ban muon xoa event nao")) {
            return "Xóa lịch " + message;
        }
        if (containsAny(assistant, "ban muon sua task nao")) {
            return "Sửa task " + message;
        }
        if (containsAny(assistant, "ban muon sua event nao")) {
            return "Sửa lịch " + message;
        }
        if (containsAny(assistant, "ban muon doi thong tin nao cua task")) {
            String title = quotedTitle(lastAssistant);
            if (!title.isBlank()) {
                return "Sửa task " + title + " " + message;
            }
        }
        if (containsAny(assistant, "ban muon doi thong tin nao cua event")) {
            String title = quotedTitle(lastAssistant);
            if (!title.isBlank()) {
                return "Sửa lịch " + title + " " + message;
            }
        }

        return null;
    }

    private String lastContent(List<String> history, String role) {
        String prefix = role + ":";
        for (int i = history.size() - 1; i >= 0; i--) {
            String item = history.get(i);
            if (item != null && item.startsWith(prefix)) {
                return item.substring(prefix.length()).trim();
            }
        }
        return "";
    }

    private String quotedTitle(String message) {
        Matcher matcher = Pattern.compile("\"([^\"]+)\"").matcher(normalize(message));
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private int extractDuration(String normalized) {
        Matcher matcher = MINUTES_PATTERN.matcher(normalized);
        if (matcher.find()) return Integer.parseInt(matcher.group(1));
        return 30;
    }

    private int extractPriority(String normalized) {
        if (containsAny(normalized, "gap", "quan trong", "urgent")) return 5;
        if (containsAny(normalized, "thap", "low")) return 1;
        return 2;
    }

    private String extractStatus(String normalized) {
        if (containsAny(normalized, "hoan thanh", "xong", "done", "completed")) return "completed";
        if (containsAny(normalized, "dang lam", "in progress", "doing")) return "in_progress";
        if (containsAny(normalized, "bo qua", "skip", "skipped")) return "skipped";
        return "";
    }

    private LocalDateTime extractDateTime(String normalized) {
        LocalDate date = extractDate(normalized);
        List<LocalTime> times = extractTimes(normalized);
        LocalTime time = times.isEmpty() ? null : times.get(0);

        if (date == null && time == null) return null;
        if (date == null) date = LocalDate.now();
        if (time == null) time = LocalTime.of(17, 0);
        return LocalDateTime.of(date, time);
    }

    private TimeRange extractTimeRange(String normalized) {
        LocalDate date = extractDate(normalized);
        List<LocalTime> times = extractTimes(normalized);
        if (date == null && times.isEmpty()) return new TimeRange(null, null);
        if (date == null) date = LocalDate.now();

        LocalTime startTime = times.isEmpty() ? LocalTime.of(9, 0) : times.get(0);
        LocalTime endTime = times.size() >= 2 ? times.get(1) : startTime.plusHours(1);
        LocalDate endDate = date;
        if (!endTime.isAfter(startTime)) {
            endDate = endDate.plusDays(1);
        }

        return new TimeRange(LocalDateTime.of(date, startTime), LocalDateTime.of(endDate, endTime));
    }

    private LocalDate extractDate(String normalized) {
        if (containsAny(normalized, "hom nay", "today")) return LocalDate.now();
        if (containsAny(normalized, "ngay mai", "mai", "tomorrow")) return LocalDate.now().plusDays(1);
        if (containsAny(normalized, "ngay mot", "mot ngay nua")) return LocalDate.now().plusDays(2);
        if (containsAny(normalized, "1 ngay", "mot ngay")) return LocalDate.now().plusDays(1);
        return null;
    }

    private List<LocalTime> extractTimes(String normalized) {
        List<LocalTime> times = new ArrayList<>();
        Matcher matcher = TIME_PATTERN.matcher(normalized);
        while (matcher.find()) {
            int hour = Integer.parseInt(matcher.group(1));
            String minuteText = matcher.group(2);
            String suffix = matcher.group(3);
            if (minuteText == null && suffix == null) continue;
            if (hour > 24) continue;
            int minute = minuteText == null ? 0 : Integer.parseInt(minuteText);
            if (suffix != null && suffix.equalsIgnoreCase("pm") && hour < 12) hour += 12;
            if (hour <= 23 && minute <= 59) {
                times.add(LocalTime.of(hour, minute));
            }
        }
        return times;
    }

    private String cleanupTitle(String original, List<String> prefixes) {
        String normalizedTitle = normalize(original);
        for (String prefix : prefixes) {
            normalizedTitle = normalizedTitle.replaceAll("^\\s*" + Pattern.quote(prefix) + "\\s*", "");
        }
        normalizedTitle = normalizedTitle.replaceAll("\\b(deadline|han|truoc|luc|vao|ngay mai|hom nay|mai|den|toi|to)\\b.*$", "");
        return normalizedTitle.replaceAll("\\s+", " ").trim();
    }

    private String cleanupUpdateTarget(String original, List<String> prefixes) {
        String normalizedTitle = normalize(original);
        normalizedTitle = normalizedTitle.replaceAll("^\\s*(sua|doi|cap nhat|chinh|chuyen|danh dau)\\s+", "");
        normalizedTitle = normalizedTitle.replaceAll("^(deadline|han|thoi han)\\s+(cua\\s+)?(task|viec|todo)\\s+", "");
        normalizedTitle = normalizedTitle.replaceAll("^(gio|thoi gian)\\s+(cua\\s+)?(event|lich|su kien)\\s+", "");
        normalizedTitle = normalizedTitle.replaceAll("^(cua\\s+)?(task|viec|todo|event|lich|su kien)\\s+", "");
        for (String prefix : prefixes) {
            normalizedTitle = normalizedTitle.replaceAll("^\\s*" + Pattern.quote(prefix) + "\\s*", "");
        }
        normalizedTitle = normalizedTitle.replaceAll("\\b(doi\\s+(deadline|han|thoi han|gio|thoi gian)|thanh|doi ten thanh|sang|qua|luc|vao|ngay mai|hom nay|mai|den|toi|to|deadline|han|hoan thanh|xong|done|completed)\\b.*$", "");
        return normalizedTitle.replaceAll("\\s+", " ").trim();
    }

    private String cleanupRenameTarget(String original) {
        String normalizedTitle = normalize(original);
        normalizedTitle = normalizedTitle.replaceAll("^\\s*(sua|doi|cap nhat|chinh|chuyen)\\s+", "");
        normalizedTitle = normalizedTitle.replaceAll("^(ten\\s+)?(cua\\s+)?(task|viec|todo|event|lich|su kien)\\s+", "");
        normalizedTitle = normalizedTitle.replaceAll("\\b(?:thanh|doi ten thanh)\\b.*$", "");
        return normalizedTitle.replaceAll("\\s+", " ").trim();
    }

    private String extractRenameTitle(String original) {
        String normalizedTitle = normalize(original);
        Matcher matcher = Pattern.compile("\\b(?:thanh|doi ten thanh)\\s+(.+)$").matcher(normalizedTitle);
        if (!matcher.find()) return "";
        return matcher.group(1).replaceAll("\\s+", " ").trim();
    }

    private boolean isRenameUpdate(String normalized) {
        if (!normalized.matches(".*\\b(?:thanh|doi ten thanh)\\b.*")) return false;
        return containsAnyTerm(normalized, "ten", "rename") || !isFieldUpdate(normalized);
    }

    private boolean isFieldUpdate(String normalized) {
        return containsAnyTerm(normalized,
                "deadline", "han", "thoi han", "gio", "thoi gian", "luc", "vao",
                "ngay mai", "hom nay", "mai", "today", "tomorrow",
                "phut", "minute", "minutes", "min",
                "hoan thanh", "xong", "done", "completed",
                "gap", "quan trong", "urgent", "thap", "low");
    }

    private String cleanupDeleteTarget(String original) {
        return normalize(original)
                .replaceAll("^\\s*(xoa|huy|remove|delete)\\s+", "")
                .replaceAll("^(task|viec|cong viec|todo|event|lich|su kien)(?:\\s+|$)", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isDurationUpdate(String normalized) {
        return containsAny(normalized, "thoi luong", "duration", "mat ", "keo dai", "trong vong")
                && MINUTES_PATTERN.matcher(normalized).find();
    }

    private boolean containsAnyTerm(String value, String... candidates) {
        for (String candidate : candidates) {
            String pattern = "(?<![a-z0-9])" + Pattern.quote(candidate) + "(?![a-z0-9])";
            if (Pattern.compile(pattern).matcher(value).find()) return true;
        }
        return false;
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) return true;
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) return "";
        String lower = value.toLowerCase(Locale.ROOT).trim();
        String decomposed = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").replace('đ', 'd');
    }

    private record TimeRange(LocalDateTime start, LocalDateTime end) {
    }
}
