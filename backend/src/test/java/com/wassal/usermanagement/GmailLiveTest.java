package com.wassal.usermanagement;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThatCode;

@Disabled("Live test against real Gmail SMTP server")
class GmailLiveTest {

    @Test
    void testSendLiveEmail() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername("zaidaneayman738@gmail.com");
        mailSender.setPassword("qsge uvbo olje ykiy");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("zaidaneayman738@gmail.com");
        message.setTo("aymanzaidanestuff@gmail.com");
        message.setSubject("Wassal Platform — Test Email Verification");
        message.setText("Hello Ayman,\n\nThis is a test email sent from the Wassal User Management backend to verify that Gmail SMTP integration is working properly.\n\nPlease confirm receipt!\n\nBest regards,\nWassal Platform");

        assertThatCode(() -> mailSender.send(message)).doesNotThrowAnyException();
        System.out.println("LIVE EMAIL SENT SUCCESSFULLY TO aymanzaidanestuff@gmail.com!");
    }
}
