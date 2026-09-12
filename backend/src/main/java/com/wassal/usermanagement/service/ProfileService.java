package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.ChangePasswordRequest;
import com.wassal.usermanagement.dto.UpdateProfileRequest;
import com.wassal.usermanagement.dto.UserSummaryDto;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.exception.InvalidCredentialsException;
import com.wassal.usermanagement.exception.ResourceNotFoundException;
import com.wassal.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserSummaryDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return UserSummaryDto.fromEntity(user);
    }

    @Transactional
    public UserSummaryDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // BR-11: A user may always view/edit own firstName, lastName, phoneNumber. Cannot self-edit email, role, accountStatus, blocked.
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhoneNumber(request.phoneNumber().trim());

        User saved = userRepository.save(user);
        return UserSummaryDto.fromEntity(saved);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password does not match.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
