package com.timeplanner.integration.google.repository;

import com.timeplanner.integration.google.entity.GoogleCalendarToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoogleCalendarTokenRepository extends JpaRepository<GoogleCalendarToken, String> {
    Optional<GoogleCalendarToken> findByUserId(String userId);
    void deleteByUserId(String userId);
}
