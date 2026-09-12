package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.ContactDto;
import com.wassal.usermanagement.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${wassal.mail.from:noreply@wassal.org}")
    private String fromEmail;

    @Value("${wassal.mail.login-url:http://localhost:3000/login}")
    private String loginUrl;

    @Value("${wassal.mail.mock-mode:false}")
    private boolean mockMode;

    @Override
    public void sendAccountApprovedEmail(User user) {
        String subject = "Wassal Platform — Account Approved";
        String body = String.format("""
                Hello %s,

                Your account has been approved by the platform administrators.
                You can now log in using the following link:
                %s

                Welcome to Wassal!
                """, user.getFirstName(), loginUrl);

        sendEmail(user.getEmail(), subject, body);
    }

    @Override
    public void sendAccountRejectedEmail(User user, ContactDto contact) {
        String subject = "Wassal Platform — Account Registration Notice";
        String body = String.format("""
                Hello %s,

                We regret to inform you that your registration request has been rejected.
                If you believe this was in error or wish to request reconsideration, please contact an administrator directly:

                Name: %s
                Email: %s
                Phone: %s

                Regards,
                Wassal Platform Administration
                """, user.getFirstName(), contact.name(), contact.email(), contact.phone());

        sendEmail(user.getEmail(), subject, body);
    }

    @Override
    public void sendPasswordResetCodeEmail(User user, String code) {
        String subject = "Wassal Platform — Password Reset Code";
        String body = String.format("""
                Hello %s,

                Your password reset code is: %s

                This code is valid for 10 minutes and will be invalidated after 5 failed verification attempts.
                If you did not request this, please ignore this email.

                Regards,
                Wassal Security Team
                """, user.getFirstName(), code);

        sendEmail(user.getEmail(), subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        if (mockMode) {
            log.info("[MOCK EMAIL] To: {} | Subject: {}\nBody:\n{}", to, subject, body);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("JavaMailSender not available. Fallback to log. To: {}, Subject: {}", to, subject);
            log.info("[FALLBACK EMAIL] To: {} | Subject: {}\nBody:\n{}", to, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception ex) {
            log.warn("Failed to send email to {} via SMTP: {}. Logging email content instead.", to, ex.getMessage());
            log.info("[EMAIL LOG FALLBACK] To: {} | Subject: {}\nBody:\n{}", to, subject, body);
        }
    }
}
