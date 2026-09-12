package com.wassal.usermanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyResetCodeRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Reset code is required")
        @Pattern(regexp = "^\\d{6}$", message = "Reset code must be a 6-digit number")
        String code
) {}
