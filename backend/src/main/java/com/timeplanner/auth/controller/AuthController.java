package com.timeplanner.auth.controller;

import com.timeplanner.auth.dto.AuthResponse;
import com.timeplanner.auth.dto.LoginRequest;
import com.timeplanner.auth.dto.SignUpRequest;
import com.timeplanner.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/sign-up")
    public ResponseEntity<Map<String, Object>> signUp(@Valid @RequestBody SignUpRequest request) {
        AuthResponse response = authService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", response));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(Map.of("data", response));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<Map<String, Object>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", Map.of("code", "INVALID_REQUEST", "message", "refreshToken is required")
            ));
        }
        AuthResponse response = authService.refresh(refreshToken);
        return ResponseEntity.ok(Map.of("data", response));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        // Stateless JWT: client-side token removal
        // In production, consider a token blacklist with Redis
        return ResponseEntity.ok(Map.of("data", Map.of("message", "Đăng xuất thành công")));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        AuthResponse.UserInfo userInfo = authService.me(userId);
        return ResponseEntity.ok(Map.of("data", userInfo));
    }
}
