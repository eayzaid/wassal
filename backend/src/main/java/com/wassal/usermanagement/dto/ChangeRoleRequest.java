package com.wassal.usermanagement.dto;

import com.wassal.usermanagement.entity.Role;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(
        @NotNull(message = "Role is required")
        Role role
) {}
