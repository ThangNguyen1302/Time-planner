package com.timeplanner.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.access-token-minutes}")
    private long accessTokenMinutes;

    @Value("${app.jwt.refresh-token-days}")
    private long refreshTokenDays;

    public String generateAccessToken(String userId, String email) {
        return buildToken(Map.of("email", email, "type", "access"),
                userId,
                Instant.now().plus(accessTokenMinutes, ChronoUnit.MINUTES));
    }

    public String generateRefreshToken(String userId) {
        return buildToken(Map.of("type", "refresh"),
                userId,
                Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS));
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractTokenType(String token) {
        return extractAllClaims(token).get("type", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, Instant expiry) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuer("timeplanner")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiry))
                .signWith(getSigningKey())
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        // Use the secret directly as bytes for HMAC
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
