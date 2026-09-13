package com.wassal.usermanagement.controller;

import com.wassal.usermanagement.dto.ForgotPasswordRequest;
import com.wassal.usermanagement.dto.LoginRequest;
import com.wassal.usermanagement.dto.LoginResponse;
import com.wassal.usermanagement.dto.MessageResponse;
import com.wassal.usermanagement.dto.RegisterRequest;
import com.wassal.usermanagement.dto.ResetPasswordRequest;
import com.wassal.usermanagement.dto.UserSummaryDto;
import com.wassal.usermanagement.dto.VerifyResetCodeRequest;
import com.wassal.usermanagement.dto.VerifyResetCodeResponse;
import com.wassal.usermanagement.service.AuthService;
import com.wassal.usermanagement.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.wassal.usermanagement.security.UserPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public endpoints for registration, authentication, token refresh, and password recovery")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    @Operation(summary = "Register a new member account")
    public ResponseEntity<UserSummaryDto> register(@Valid @RequestBody RegisterRequest request) {
        UserSummaryDto created = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials and receive access token + refresh cookie")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.refreshCookie().toString())
                .body(result.loginResponse());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and obtain new access token")
    public ResponseEntity<LoginResponse> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        AuthService.AuthResult result = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.refreshCookie().toString())
                .body(result.loginResponse());
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke active refresh token and clear cookie")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            @AuthenticationPrincipal UserPrincipal principal) {
        ResponseCookie clearCookie = authService.logout(refreshToken, principal != null ? principal.getId() : null);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a 6-digit password reset code")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request);
        return ResponseEntity.ok(new MessageResponse("If this email is registered, a password reset code has been sent."));
    }

    @PostMapping("/verify-reset-code")
    @Operation(summary = "Verify 6-digit code and exchange for a one-time reset token")
    public ResponseEntity<VerifyResetCodeResponse> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        VerifyResetCodeResponse response = passwordResetService.verifyResetCode(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set a new password using a verified reset token")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Password has been successfully reset."));
    }
}
