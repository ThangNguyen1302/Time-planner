package com.timeplanner.habit.service;

import com.timeplanner.habit.dto.*;
import com.timeplanner.habit.entity.Habit;
import com.timeplanner.habit.entity.HabitCompletion;
import com.timeplanner.habit.repository.HabitCompletionRepository;
import com.timeplanner.habit.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;

    public Page<HabitResponse> getHabitsByUser(String userId, Pageable pageable) {
        return habitRepository.findByUserId(userId, pageable).map(HabitResponse::from);
    }

    public HabitResponse getHabit(String userId, String habitId) {
        return HabitResponse.from(findAndVerifyOwnership(userId, habitId));
    }

    @Transactional
    public HabitResponse createHabit(String userId, CreateHabitRequest request) {
        Habit habit = Habit.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .duration(request.getDuration())
                .frequency(request.getFrequency())
                .preferredTimeStart(request.getPreferredTimeStart())
                .preferredTimeEnd(request.getPreferredTimeEnd())
                .color(request.getColor() != null ? request.getColor() : "#10B981")
                .isActive(true)
                .build();
        return HabitResponse.from(habitRepository.save(habit));
    }

    @Transactional
    public HabitResponse updateHabit(String userId, String habitId, UpdateHabitRequest request) {
        Habit habit = findAndVerifyOwnership(userId, habitId);

        if (request.getTitle() != null) habit.setTitle(request.getTitle());
        if (request.getDescription() != null) habit.setDescription(request.getDescription());
        if (request.getDuration() != null) habit.setDuration(request.getDuration());
        if (request.getFrequency() != null) habit.setFrequency(request.getFrequency());
        if (request.getPreferredTimeStart() != null) habit.setPreferredTimeStart(request.getPreferredTimeStart());
        if (request.getPreferredTimeEnd() != null) habit.setPreferredTimeEnd(request.getPreferredTimeEnd());
        if (request.getColor() != null) habit.setColor(request.getColor());
        if (request.getIsActive() != null) habit.setActive(request.getIsActive());

        return HabitResponse.from(habitRepository.save(habit));
    }

    @Transactional
    public void deleteHabit(String userId, String habitId) {
        Habit habit = findAndVerifyOwnership(userId, habitId);
        habitRepository.delete(habit);
    }

    @Transactional
    public HabitCompletionResponse completeHabit(String userId, String habitId, String notes) {
        Habit habit = findAndVerifyOwnership(userId, habitId);
        if (!habit.isActive()) {
            throw new IllegalArgumentException("Thói quen đã bị vô hiệu hóa");
        }

        HabitCompletion completion = HabitCompletion.builder()
                .habitId(habitId)
                .userId(userId)
                .completedAt(LocalDateTime.now())
                .notes(notes)
                .build();
        return HabitCompletionResponse.from(completionRepository.save(completion));
    }

    public List<HabitCompletionResponse> getCompletions(String userId, String habitId,
                                                         LocalDateTime from, LocalDateTime to) {
        findAndVerifyOwnership(userId, habitId);
        if (from != null && to != null) {
            return completionRepository.findByHabitIdAndDateRange(habitId, from, to)
                    .stream().map(HabitCompletionResponse::from).toList();
        }
        return completionRepository.findByHabitIdOrderByCompletedAtDesc(habitId)
                .stream().map(HabitCompletionResponse::from).toList();
    }

    private Habit findAndVerifyOwnership(String userId, String habitId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new IllegalArgumentException("Thói quen không tồn tại"));
        if (!habit.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập thói quen này");
        }
        return habit;
    }
}
