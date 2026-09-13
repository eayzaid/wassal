package com.wassal.usermanagement.controller;

import com.wassal.usermanagement.dto.ChangeRoleRequest;
import com.wassal.usermanagement.dto.UserSummaryDto;
import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.security.UserPrincipal;
import com.wassal.usermanagement.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin User Management", description = "Administration endpoints requiring ROLE_ADMIN privilege")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final UserManagementService userManagementService;

    @GetMapping
    @Operation(summary = "List, filter, and search user directory with pagination")
    public ResponseEntity<Page<UserSummaryDto>> listUsers(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean blocked,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<UserSummaryDto> page = userManagementService.listUsers(status, role, blocked, q, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<UserSummaryDto> getUserById(@PathVariable Long id) {
        UserSummaryDto user = userManagementService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a pending registration or accept a previously rejected user")
    public ResponseEntity<UserSummaryDto> approveUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        UserSummaryDto approved = userManagementService.approveUser(id, actor);
        return ResponseEntity.ok(approved);
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject a pending user registration (only applicable to PENDING_APPROVAL; accepted users can only be blocked)")
    public ResponseEntity<UserSummaryDto> rejectUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        UserSummaryDto rejected = userManagementService.rejectUser(id, actor);
        return ResponseEntity.ok(rejected);
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Change a user's role subject to hierarchy rules")
    public ResponseEntity<UserSummaryDto> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeRoleRequest request,
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        UserSummaryDto updated = userManagementService.changeUserRole(id, request, actor);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/block")
    @Operation(summary = "Block a user account and revoke active sessions")
    public ResponseEntity<UserSummaryDto> blockUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        UserSummaryDto blocked = userManagementService.blockUser(id, actor);
        return ResponseEntity.ok(blocked);
    }

    @PatchMapping("/{id}/unblock")
    @Operation(summary = "Unblock a user account")
    public ResponseEntity<UserSummaryDto> unblockUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        UserSummaryDto unblocked = userManagementService.unblockUser(id, actor);
        return ResponseEntity.ok(unblocked);
    }
}
