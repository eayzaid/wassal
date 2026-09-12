package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.LoginRequest;
import com.wassal.usermanagement.dto.LoginResponse;
import com.wassal.usermanagement.dto.RegisterRequest;
import com.wassal.usermanagement.dto.UserSummaryDto;
import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.RefreshToken;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.exception.AccountBlockedException;
import com.wassal.usermanagement.exception.AccountPendingApprovalException;
import com.wassal.usermanagement.exception.AccountRejectedException;
import com.wassal.usermanagement.exception.EmailAlreadyExistsException;
import com.wassal.usermanagement.exception.InvalidCredentialsException;
import com.wassal.usermanagement.exception.InvalidTokenException;
import com.wassal.usermanagement.repository.RefreshTokenRepository;
import com.wassal.usermanagement.repository.UserRepository;
import com.wassal.usermanagement.security.HashUtils;
import com.wassal.usermanagement.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ContactService contactService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public record AuthResult(LoginResponse loginResponse, ResponseCookie refreshCookie) {}

    @Transactional
    public UserSummaryDto register(RegisterRequest request) {
        // BR-1: email unique across users
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("An account with this email already exists.");
        }

        // BR-2: Registration always creates role=MEMBER, accountStatus=PENDING_APPROVAL, blocked=false
        User user = User.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(request.email().toLowerCase().trim())
                .phoneNumber(request.phoneNumber().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.PENDING_APPROVAL)
                .blocked(false)
                .build();

        User savedUser = userRepository.save(user);
        return UserSummaryDto.fromEntity(savedUser);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Incorrect email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Incorrect email or password.");
        }

        // BR-3: accountStatus=PENDING_APPROVAL -> login rejected, error ACCOUNT_PENDING_APPROVAL
        if (user.getAccountStatus() == AccountStatus.PENDING_APPROVAL) {
            throw new AccountPendingApprovalException("Your account is awaiting admin approval.");
        }

        // BR-4: accountStatus=REJECTED -> login rejected, error ACCOUNT_REJECTED (includes contact block)
        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            throw new AccountRejectedException(
                    "Your registration was rejected. Contact an administrator to request reconsideration.",
                    contactService.resolveAdminContact()
            );
        }

        // BR-5: blocked=true -> login rejected, error ACCOUNT_BLOCKED (includes contact block)
        if (user.isBlocked()) {
            throw new AccountBlockedException(
                    "Your account has been blocked. Contact an administrator.",
                    contactService.resolveAdminContact()
            );
        }

        return generateTokensAndCookie(user);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidTokenException("Refresh token is required.");
        }

        String tokenHash = HashUtils.sha256(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token."));

        if (token.isRevoked() || token.isExpired()) {
            throw new InvalidTokenException("Refresh token is revoked or expired.");
        }

        // FR-4: rotate old row -> revoked=true
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new InvalidTokenException("User not found for refresh token."));

        if (user.isBlocked() || user.getAccountStatus() != AccountStatus.APPROVED) {
            throw new InvalidTokenException("User is not authorized.");
        }

        return generateTokensAndCookie(user);
    }

    @Transactional
    public ResponseCookie logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = HashUtils.sha256(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
        return createCookie("", 0);
    }

    private AuthResult generateTokensAndCookie(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getRole());

        // Generate cryptographically secure random refresh token
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawRefreshToken = UUID.randomUUID() + "-" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = HashUtils.sha256(rawRefreshToken);
        Instant expiresAt = Instant.now().plusSeconds(jwtTokenProvider.getRefreshTokenExpirationSeconds());

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        ResponseCookie cookie = createCookie(rawRefreshToken, jwtTokenProvider.getRefreshTokenExpirationSeconds());
        return new AuthResult(new LoginResponse(accessToken), cookie);
    }

    private ResponseCookie createCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(jwtTokenProvider.isCookieSecure())
                .sameSite(jwtTokenProvider.getCookieSameSite())
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .build();
    }
}
