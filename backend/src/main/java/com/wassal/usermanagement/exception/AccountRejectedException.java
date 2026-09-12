package com.wassal.usermanagement.exception;

import com.wassal.usermanagement.dto.ContactDto;
import lombok.Getter;

@Getter
public class AccountRejectedException extends RuntimeException {
    private final ContactDto contact;

    public AccountRejectedException(String message, ContactDto contact) {
        super(message);
        this.contact = contact;
    }
}
