package com.wassal.usermanagement.exception;

public class AccountPendingApprovalException extends RuntimeException {
    public AccountPendingApprovalException(String message) {
        super(message);
    }
}
