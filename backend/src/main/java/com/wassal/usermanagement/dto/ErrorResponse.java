package com.wassal.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String error,
        String message,
        ContactDto contact
) {
    public ErrorResponse(String error, String message) {
        this(error, message, null);
    }
}
