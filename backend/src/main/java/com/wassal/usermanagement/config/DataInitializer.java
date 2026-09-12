package com.wassal.usermanagement.config;

import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${wassal.seed-mock-data:true}")
    private boolean seedMockData;

    @Override
    public void run(String... args) {
        if (!seedMockData) {
            log.info("Mock data seeding is disabled.");
            return;
        }

        if (userRepository.count() > 0) {
            log.info("Database already contains users. Skipping mock data initialization.");
            return;
        }

        log.info("Seeding initial mock users for development and testing...");

        String defaultPassword = passwordEncoder.encode("Password123!");

        List<User> mockUsers = List.of(
                // 1. Active President (holds ROLE_PRESIDENT and ROLE_ADMIN)
                User.builder()
                        .firstName("Amine")
                        .lastName("Bennani")
                        .email("president@wassal.org")
                        .phoneNumber("+212600000001")
                        .password(defaultPassword)
                        .role(Role.PRESIDENT)
                        .accountStatus(AccountStatus.APPROVED)
                        .blocked(false)
                        .build(),

                // 2. Active Vice President (holds ROLE_VICE_PRESIDENT and ROLE_ADMIN)
                User.builder()
                        .firstName("Sarah")
                        .lastName("Mansouri")
                        .email("vp@wassal.org")
                        .phoneNumber("+212600000002")
                        .password(defaultPassword)
                        .role(Role.VICE_PRESIDENT)
                        .accountStatus(AccountStatus.APPROVED)
                        .blocked(false)
                        .build(),

                // 3. Active RH (holds ROLE_RH and ROLE_ADMIN, subject to BR-9 and BR-13)
                User.builder()
                        .firstName("Youssef")
                        .lastName("Alami")
                        .email("rh@wassal.org")
                        .phoneNumber("+212600000003")
                        .password(defaultPassword)
                        .role(Role.RH)
                        .accountStatus(AccountStatus.APPROVED)
                        .blocked(false)
                        .build(),

                // 4. Team Leader
                User.builder()
                        .firstName("Fatima")
                        .lastName("Zahra")
                        .email("teamleader@wassal.org")
                        .phoneNumber("+212600000004")
                        .password(defaultPassword)
                        .role(Role.TEAM_LEADER)
                        .accountStatus(AccountStatus.APPROVED)
                        .blocked(false)
                        .build(),

                // 5. Active Member
                User.builder()
                        .firstName("Mehdi")
                        .lastName("Tahiri")
                        .email("member@wassal.org")
                        .phoneNumber("+212600000005")
                        .password(defaultPassword)
                        .role(Role.MEMBER)
                        .accountStatus(AccountStatus.APPROVED)
                        .blocked(false)
                        .build(),

                // 6. Pending Member (for testing BR-3 & admin approval/rejection)
                User.builder()
                        .firstName("Lina")
                        .lastName("Idrissi")
                        .email("pending@wassal.org")
                        .phoneNumber("+212600000006")
                        .password(defaultPassword)
                        .role(Role.MEMBER)
                        .accountStatus(AccountStatus.PENDING_APPROVAL)
                        .blocked(false)
                        .build(),

                // 7. Rejected Member (for testing BR-4)
                User.builder()
                        .firstName("Omar")
                        .lastName("Berrada")
                        .email("rejected@wassal.org")
                        .phoneNumber("+212600000007")
                        .password(defaultPassword)
                        .role(Role.MEMBER)
                        .accountStatus(AccountStatus.REJECTED)
                        .blocked(false)
                        .build(),

                // 8. Blocked Member (for testing BR-5)
                User.builder()
                        .firstName("Karim")
                        .lastName("Zouhair")
                        .email("blocked@wassal.org")
                        .phoneNumber("+212600000008")
                        .password(defaultPassword)
                        .role(Role.MEMBER)
                        .accountStatus(AccountStatus.APPROVED)
                        .blocked(true)
                        .build()
        );

        userRepository.saveAll(mockUsers);
        log.info("Successfully seeded {} mock users. All mock accounts share password: Password123!", mockUsers.size());
    }
}
