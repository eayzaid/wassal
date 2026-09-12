package com.wassal.usermanagement.dto;

import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;

import java.time.Instant;

public record UserSummaryDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        Role role,
        AccountStatus accountStatus,
        boolean blocked,
        Instant createdAt
) {
    public static UserSummaryDto fromEntity(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getAccountStatus(),
                user.isBlocked(),
                user.getCreatedAt()
        );
    }
}
