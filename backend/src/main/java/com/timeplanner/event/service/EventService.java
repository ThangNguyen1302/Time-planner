package com.timeplanner.event.service;

import com.timeplanner.event.dto.CreateEventRequest;
import com.timeplanner.event.dto.EventResponse;
import com.timeplanner.event.dto.UpdateEventRequest;
import com.timeplanner.event.entity.Event;
import com.timeplanner.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public Page<EventResponse> getEventsByUser(String userId, Pageable pageable) {
        return eventRepository.findByUserId(userId, pageable).map(EventResponse::from);
    }

    public List<EventResponse> getEventsInRange(String userId, LocalDateTime from, LocalDateTime to) {
        return eventRepository.findByUserIdAndTimeRange(userId, from, to)
                .stream().map(EventResponse::from).toList();
    }

    public EventResponse getEvent(String userId, String eventId) {
        return EventResponse.from(findAndVerifyOwnership(userId, eventId));
    }

    @Transactional
    public EventResponse createEvent(String userId, CreateEventRequest request) {
        Event event = Event.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isRecurring(request.isRecurring())
                .recurrenceRule(request.getRecurrenceRule())
                .color(request.getColor() != null ? request.getColor() : "#8B5CF6")
                .build();
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(String userId, String eventId, UpdateEventRequest request) {
        Event event = findAndVerifyOwnership(userId, eventId);

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getIsRecurring() != null) event.setRecurring(request.getIsRecurring());
        if (request.getRecurrenceRule() != null) event.setRecurrenceRule(request.getRecurrenceRule());
        if (request.getColor() != null) event.setColor(request.getColor());

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(String userId, String eventId) {
        Event event = findAndVerifyOwnership(userId, eventId);
        eventRepository.delete(event);
    }

    private Event findAndVerifyOwnership(String userId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại"));
        if (!event.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập sự kiện này");
        }
        return event;
    }
}
