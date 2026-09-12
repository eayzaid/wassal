package com.wassal.usermanagement.exception;

public class InsufficientPrivilegeException extends RuntimeException {
    public InsufficientPrivilegeException(String message) {
        super(message);
    }
}
