package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.ContactDto;
import com.wassal.usermanagement.entity.User;

public interface EmailService {

    void sendAccountApprovedEmail(User user);

    void sendAccountRejectedEmail(User user, ContactDto contact);

    void sendPasswordResetCodeEmail(User user, String code);
}
