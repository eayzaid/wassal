package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.ContactDto;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final UserRepository userRepository;

    @Value("${wassal.contact.default-name:Wassal Administration}")
    private String defaultName;

    @Value("${wassal.contact.default-email:contact@wassal.org}")
    private String defaultEmail;

    @Value("${wassal.contact.default-phone:+212500000000}")
    private String defaultPhone;

    @Transactional(readOnly = true)
    public ContactDto resolveAdminContact() {
        // 1. Try to find an active PRESIDENT
        User president = userRepository.findFirstByRole(Role.PRESIDENT).orElse(null);
        if (president != null) {
            return new ContactDto(
                    president.getFirstName() + " " + president.getLastName(),
                    president.getEmail(),
                    president.getPhoneNumber()
            );
        }

        // 2. Fall back to VICE_PRESIDENT
        User vicePresident = userRepository.findFirstByRole(Role.VICE_PRESIDENT).orElse(null);
        if (vicePresident != null) {
            return new ContactDto(
                    vicePresident.getFirstName() + " " + vicePresident.getLastName(),
                    vicePresident.getEmail(),
                    vicePresident.getPhoneNumber()
            );
        }

        // 3. Fall back to configured default contact info
        return new ContactDto(defaultName, defaultEmail, defaultPhone);
    }
}
