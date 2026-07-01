package com.timeplanner.integration.google.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "google_calendar_tokens")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GoogleCalendarToken {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(name = "access_token", columnDefinition = "text", nullable = false)
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "text", nullable = false)
    private String refreshToken;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "scope", length = 500)
    private String scope;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
