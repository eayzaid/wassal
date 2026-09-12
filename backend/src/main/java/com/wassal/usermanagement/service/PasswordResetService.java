package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.ForgotPasswordRequest;
import com.wassal.usermanagement.dto.ResetPasswordRequest;
import com.wassal.usermanagement.dto.VerifyResetCodeRequest;
import com.wassal.usermanagement.dto.VerifyResetCodeResponse;
import com.wassal.usermanagement.entity.PasswordResetCode;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.exception.InvalidOperationException;
import com.wassal.usermanagement.repository.PasswordResetCodeRepository;
import com.wassal.usermanagement.repository.RefreshTokenRepository;
import com.wassal.usermanagement.repository.UserRepository;
import com.wassal.usermanagement.security.HashUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository resetCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", email);
            return; // 200 always to prevent user enumeration
        }

        User user = userOpt.get();

        // Invalidate any existing unused reset codes for this user
        resetCodeRepository.markAllUsedByUserId(user.getId());

        // Generate 6-digit numeric code (e.g. 100000 - 999999)
        int codeInt = 100000 + RANDOM.nextInt(900000);
        String code = String.valueOf(codeInt);
        String codeHash = HashUtils.sha256(code);

        PasswordResetCode resetCode = PasswordResetCode.builder()
                .userId(user.getId())
                .codeHash(codeHash)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .attempts(0)
                .build();

        resetCodeRepository.save(resetCode);
        emailService.sendPasswordResetCodeEmail(user, code);
    }

    @Transactional(noRollbackFor = InvalidOperationException.class)
    public VerifyResetCodeResponse verifyResetCode(VerifyResetCodeRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidOperationException("Invalid reset code or email."));

        PasswordResetCode resetCode = resetCodeRepository
                .findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new InvalidOperationException("No active reset request found."));

        if (resetCode.isExpired()) {
            resetCode.setUsed(true);
            resetCodeRepository.save(resetCode);
            throw new InvalidOperationException("Reset code has expired.");
        }

        if (resetCode.hasExceededAttempts()) {
            resetCode.setUsed(true);
            resetCodeRepository.save(resetCode);
            throw new InvalidOperationException("Reset code has been invalidated due to too many attempts.");
        }

        String inputCodeHash = HashUtils.sha256(request.code().trim());
        if (!inputCodeHash.equals(resetCode.getCodeHash())) {
            resetCode.setAttempts(resetCode.getAttempts() + 1);
            if (resetCode.hasExceededAttempts()) {
                resetCode.setUsed(true);
            }
            resetCodeRepository.save(resetCode);
            throw new InvalidOperationException("Invalid reset code.");
        }

        // Code matched! Generate one-time reset token
        String resetToken = UUID.randomUUID().toString();
        resetCode.setResetToken(resetToken);
        resetCodeRepository.save(resetCode);

        return new VerifyResetCodeResponse(resetToken);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetCode resetCode = resetCodeRepository.findByResetToken(request.resetToken().trim())
                .orElseThrow(() -> new InvalidOperationException("Invalid or expired reset token."));

        if (!resetCode.isValid() || resetCode.getResetToken() == null) {
            throw new InvalidOperationException("Invalid or expired reset token.");
        }

        User user = userRepository.findById(resetCode.getUserId())
                .orElseThrow(() -> new InvalidOperationException("User associated with reset token not found."));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Invalidate the reset code
        resetCode.setUsed(true);
        resetCodeRepository.save(resetCode);

        // Revoke all existing sessions for security
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }
}
