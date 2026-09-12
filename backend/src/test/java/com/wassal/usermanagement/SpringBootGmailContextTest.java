package com.wassal.usermanagement;

import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.service.EmailService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@Disabled("Live test against real Gmail SMTP server")
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:mailtest;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "wassal.mail.mock-mode=false"
})
class SpringBootGmailContextTest {

    @Autowired
    private EmailService emailService;

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Test
    void testSpringInjectedMailSender() {
        assertThat(javaMailSender).isNotNull();

        User testUser = User.builder()
                .firstName("Ayman")
                .lastName("Zaidane")
                .email("aymanzaidanestuff@gmail.com")
                .build();

        assertThatCode(() -> emailService.sendPasswordResetCodeEmail(testUser, "948271"))
                .doesNotThrowAnyException();

        System.out.println("SPRING BOOT EMAIL SERVICE SENT RESET CODE EMAIL SUCCESSFULLY TO aymanzaidanestuff@gmail.com!");
    }
}
