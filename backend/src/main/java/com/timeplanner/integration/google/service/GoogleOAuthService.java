package com.timeplanner.integration.google.service;

import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.timeplanner.integration.google.entity.GoogleCalendarToken;
import com.timeplanner.integration.google.repository.GoogleCalendarTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final GoogleCalendarTokenRepository tokenRepository;

    @Value("${app.google.client-id}")
    private String clientId;

    @Value("${app.google.client-secret}")
    private String clientSecret;

    @Value("${app.google.redirect-uri}")
    private String redirectUri;

    private static final List<String> SCOPES = List.of(
            "https://www.googleapis.com/auth/calendar.readonly"
    );

    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Generate the Google OAuth2 consent URL.
     * The state parameter carries the userId so we can associate the token after callback.
     */
    public String getAuthorizationUrl(String userId) {
        try {
            GoogleAuthorizationCodeFlow flow = buildFlow();
            return flow.newAuthorizationUrl()
                    .setRedirectUri(redirectUri)
                    .setState(userId)
                    .setAccessType("offline")
                    .setApprovalPrompt("force")
                    .build();
        } catch (Exception e) {
            log.error("Failed to generate Google auth URL", e);
            throw new RuntimeException("Không thể tạo URL xác thực Google", e);
        }
    }

    /**
     * Exchange authorization code for tokens and store them.
     */
    @Transactional
    public void handleCallback(String code, String userId) {
        try {
            GoogleAuthorizationCodeFlow flow = buildFlow();
            TokenResponse tokenResponse = flow.newTokenRequest(code)
                    .setRedirectUri(redirectUri)
                    .execute();

            // Calculate expiry
            long expiresInSeconds = tokenResponse.getExpiresInSeconds() != null
                    ? tokenResponse.getExpiresInSeconds() : 3600;
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expiresInSeconds);

            // Upsert token
            GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                    .orElse(GoogleCalendarToken.builder().userId(userId).build());

            token.setAccessToken(tokenResponse.getAccessToken());
            if (tokenResponse.getRefreshToken() != null) {
                token.setRefreshToken(tokenResponse.getRefreshToken());
            }
            token.setExpiresAt(expiresAt);
            token.setScope(String.join(" ", SCOPES));

            tokenRepository.save(token);
            log.info("Google Calendar token saved for user: {}", userId);

        } catch (Exception e) {
            log.error("Failed to handle Google OAuth callback", e);
            throw new RuntimeException("Không thể xử lý callback từ Google", e);
        }
    }

    /**
     * Check if user has connected Google Calendar.
     */
    public boolean isConnected(String userId) {
        return tokenRepository.findByUserId(userId).isPresent();
    }

    /**
     * Get stored token, refreshing if expired.
     */
    public GoogleCalendarToken getValidToken(String userId) {
        GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Chưa kết nối Google Calendar"));

        // Refresh if expired
        if (token.getExpiresAt().isBefore(LocalDateTime.now().plusMinutes(5))) {
            refreshToken(token);
        }

        return token;
    }

    @Transactional
    public void disconnect(String userId) {
        tokenRepository.deleteByUserId(userId);
        log.info("Google Calendar disconnected for user: {}", userId);
    }

    private void refreshToken(GoogleCalendarToken token) {
        try {
            GoogleAuthorizationCodeFlow flow = buildFlow();
            TokenResponse tokenResponse = flow.newTokenRequest("")
                    .setGrantType("refresh_token")
                    .set("refresh_token", token.getRefreshToken())
                    .execute();

            long expiresInSeconds = tokenResponse.getExpiresInSeconds() != null
                    ? tokenResponse.getExpiresInSeconds() : 3600;

            token.setAccessToken(tokenResponse.getAccessToken());
            token.setExpiresAt(LocalDateTime.now().plusSeconds(expiresInSeconds));
            if (tokenResponse.getRefreshToken() != null) {
                token.setRefreshToken(tokenResponse.getRefreshToken());
            }
            tokenRepository.save(token);
            log.info("Google token refreshed for user: {}", token.getUserId());

        } catch (Exception e) {
            log.error("Failed to refresh Google token", e);
            throw new RuntimeException("Không thể refresh Google token", e);
        }
    }

    private GoogleAuthorizationCodeFlow buildFlow() throws GeneralSecurityException, IOException {
        GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();
        details.setClientId(clientId);
        details.setClientSecret(clientSecret);

        GoogleClientSecrets clientSecrets = new GoogleClientSecrets();
        clientSecrets.setInstalled(details);

        return new GoogleAuthorizationCodeFlow.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JSON_FACTORY,
                clientSecrets,
                SCOPES)
                .setAccessType("offline")
                .build();
    }
}
