package com.wassal.usermanagement.controller;

import com.wassal.usermanagement.dto.ChangePasswordRequest;
import com.wassal.usermanagement.dto.MessageResponse;
import com.wassal.usermanagement.dto.UpdateProfileRequest;
import com.wassal.usermanagement.dto.UserSummaryDto;
import com.wassal.usermanagement.security.UserPrincipal;
import com.wassal.usermanagement.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@Tag(name = "Profile & Self-Service", description = "Self-service endpoints for authenticated users")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "View current authenticated user profile")
    public ResponseEntity<UserSummaryDto> getMyProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserSummaryDto profile = profileService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    @Operation(summary = "Update own profile fields (firstName, lastName, phoneNumber)")
    public ResponseEntity<UserSummaryDto> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserSummaryDto updated = profileService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/password")
    @Operation(summary = "Change own password using current password")
    public ResponseEntity<MessageResponse> changeMyPassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        profileService.changePassword(userPrincipal.getId(), request);
        return ResponseEntity.ok(new MessageResponse("Password updated successfully."));
    }
}
