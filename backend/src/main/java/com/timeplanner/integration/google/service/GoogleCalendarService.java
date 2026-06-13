package com.timeplanner.integration.google.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.timeplanner.integration.google.dto.GoogleCalendarEventDto;
import com.timeplanner.integration.google.entity.GoogleCalendarToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleOAuthService oAuthService;

    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * List all visible calendars for the user.
     */
    public List<Map<String, Object>> listCalendars(String userId) {
        Calendar calendarService = getCalendarService(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            String pageToken = null;
            do {
                CalendarList calendarList = calendarService.calendarList().list()
                        .setMaxResults(250)
                        .setMinAccessRole("reader")
                        .setShowHidden(true)
                        .setPageToken(pageToken)
                        .execute();

                List<CalendarListEntry> items = calendarList.getItems();
                if (items != null) {
                    for (CalendarListEntry entry : items) {
                        if (entry.getId() == null || Boolean.TRUE.equals(entry.getDeleted())) continue;

                        // Filter: include primary calendars and selected ones
                        Boolean selected = entry.getSelected();
                        Boolean primary = entry.getPrimary();
                        if (!Boolean.TRUE.equals(primary) && Boolean.FALSE.equals(selected)) continue;

                        Map<String, Object> cal = new LinkedHashMap<>();
                        cal.put("id", entry.getId());
                        cal.put("summary", entry.getSummary() != null ? entry.getSummary() : entry.getId());
                        cal.put("primary", Boolean.TRUE.equals(primary));
                        cal.put("selected", selected);
                        cal.put("accessRole", entry.getAccessRole());
                        result.add(cal);
                    }
                }

                pageToken = calendarList.getNextPageToken();
            } while (pageToken != null);

        } catch (Exception e) {
            log.error("Failed to list Google calendars for user: {}", userId, e);
            throw new RuntimeException("Không thể lấy danh sách calendar từ Google", e);
        }

        // De-duplicate by id
        Map<String, Map<String, Object>> byId = new LinkedHashMap<>();
        for (Map<String, Object> cal : result) {
            byId.putIfAbsent((String) cal.get("id"), cal);
        }
        return new ArrayList<>(byId.values());
    }

    /**
     * Get events from Google Calendar within a time range.
     */
    public List<GoogleCalendarEventDto> getEvents(String userId, String calendarId,
                                                    LocalDateTime from, LocalDateTime to,
                                                    String timeZone) {
        Calendar calendarService = getCalendarService(userId);
        List<GoogleCalendarEventDto> result = new ArrayList<>();

        ZoneId zoneId = timeZone != null ? ZoneId.of(timeZone) : ZoneId.of("Asia/Ho_Chi_Minh");
        DateTime timeMin = new DateTime(ZonedDateTime.of(from, zoneId).toInstant().toEpochMilli());
        DateTime timeMax = new DateTime(ZonedDateTime.of(to, zoneId).toInstant().toEpochMilli());

        try {
            String pageToken = null;
            do {
                Events events = calendarService.events().list(calendarId)
                        .setTimeMin(timeMin)
                        .setTimeMax(timeMax)
                        .setSingleEvents(true)
                        .setOrderBy("startTime")
                        .setMaxResults(250)
                        .setPageToken(pageToken)
                        .execute();

                List<Event> items = events.getItems();
                if (items != null) {
                    for (Event event : items) {
                        GoogleCalendarEventDto dto = mapEvent(event, calendarId, zoneId);
                        if (dto != null) result.add(dto);
                    }
                }

                pageToken = events.getNextPageToken();
            } while (pageToken != null);

        } catch (Exception e) {
            log.error("Failed to get events from Google Calendar for user: {}", userId, e);
            throw new RuntimeException("Không thể lấy sự kiện từ Google Calendar", e);
        }

        return result;
    }

    /**
     * Get events from ALL visible calendars.
     */
    public List<GoogleCalendarEventDto> getAllEvents(String userId, LocalDateTime from,
                                                      LocalDateTime to, String timeZone) {
        List<Map<String, Object>> calendars = listCalendars(userId);
        List<GoogleCalendarEventDto> allEvents = new ArrayList<>();

        for (Map<String, Object> cal : calendars) {
            String calId = (String) cal.get("id");
            try {
                allEvents.addAll(getEvents(userId, calId, from, to, timeZone));
            } catch (Exception e) {
                log.warn("Failed to fetch events from calendar: {}", calId, e);
            }
        }

        // Sort by start time
        allEvents.sort(Comparator.comparing(GoogleCalendarEventDto::getStartTime,
                Comparator.nullsLast(Comparator.naturalOrder())));

        return allEvents;
    }

    private GoogleCalendarEventDto mapEvent(Event event, String calendarId, ZoneId zoneId) {
        if (event.getId() == null) return null;

        String summary = event.getSummary() != null ? event.getSummary() : "(Không có tiêu đề)";
        String description = event.getDescription();
        boolean allDay = false;
        String startTime;
        String endTime;

        // All-day events use date (not dateTime)
        if (event.getStart() != null && event.getStart().getDate() != null) {
            allDay = true;
            startTime = event.getStart().getDate().toStringRfc3339();
            endTime = event.getEnd() != null && event.getEnd().getDate() != null
                    ? event.getEnd().getDate().toStringRfc3339()
                    : startTime;
        } else if (event.getStart() != null && event.getStart().getDateTime() != null) {
            startTime = event.getStart().getDateTime().toStringRfc3339();
            endTime = event.getEnd() != null && event.getEnd().getDateTime() != null
                    ? event.getEnd().getDateTime().toStringRfc3339()
                    : startTime;
        } else {
            return null;
        }

        return GoogleCalendarEventDto.builder()
                .id(event.getId())
                .summary(summary)
                .description(description)
                .startTime(startTime)
                .endTime(endTime)
                .allDay(allDay)
                .calendarId(calendarId)
                .build();
    }

    private Calendar getCalendarService(String userId) {
        GoogleCalendarToken token = oAuthService.getValidToken(userId);

        try {
            GoogleCredentials credentials = GoogleCredentials.create(
                    new AccessToken(token.getAccessToken(),
                            Date.from(token.getExpiresAt().atZone(ZoneId.systemDefault()).toInstant())));

            return new Calendar.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("TimePlanner")
                    .build();
        } catch (Exception e) {
            log.error("Failed to create Google Calendar service", e);
            throw new RuntimeException("Không thể kết nối Google Calendar service", e);
        }
    }
}
