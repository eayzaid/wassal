package com.wassal.usermanagement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wassal.usermanagement.dto.ChangePasswordRequest;
import com.wassal.usermanagement.dto.UpdateProfileRequest;
import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.repository.PasswordResetCodeRepository;
import com.wassal.usermanagement.repository.RefreshTokenRepository;
import com.wassal.usermanagement.repository.UserRepository;
import com.wassal.usermanagement.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfileIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetCodeRepository resetCodeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User user;
    private String userToken;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        resetCodeRepository.deleteAll();
        userRepository.deleteAll();

        // Create a President for contact block resolution
        userRepository.save(User.builder()
                .firstName("President")
                .lastName("Chief")
                .email("president@wassal.org")
                .phoneNumber("+212600000099")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.PRESIDENT)
                .accountStatus(AccountStatus.APPROVED)
                .build());

        user = userRepository.save(User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@wassal.org")
                .phoneNumber("+212600000100")
                .password(passwordEncoder.encode("CurrentPass123!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(false)
                .build());

        userToken = "Bearer " + jwtTokenProvider.generateAccessToken(user.getId(), user.getRole());
    }

    @Test
    @DisplayName("FR-9 & BR-11: View and update own profile")
    void testViewAndUpdateProfile() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("john.doe@wassal.org")))
                .andExpect(jsonPath("$.firstName", is("John")))
                .andExpect(jsonPath("$.phoneNumber", is("+212600000100")));

        UpdateProfileRequest updateRequest = new UpdateProfileRequest("Johnny", "Doer", "+212699999999");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName", is("Johnny")))
                .andExpect(jsonPath("$.lastName", is("Doer")))
                .andExpect(jsonPath("$.phoneNumber", is("+212699999999")))
                .andExpect(jsonPath("$.email", is("john.doe@wassal.org"))); // Email remains intact

        User updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updated.getFirstName()).isEqualTo("Johnny");
        assertThat(updated.getLastName()).isEqualTo("Doer");
        assertThat(updated.getPhoneNumber()).isEqualTo("+212699999999");
    }

    @Test
    @DisplayName("FR-9: Change password requires valid current password")
    void testChangePassword() throws Exception {
        // Wrong current password -> 401 INVALID_CREDENTIALS
        ChangePasswordRequest wrongRequest = new ChangePasswordRequest("WrongPass!", "NewPassword123!");
        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("INVALID_CREDENTIALS")));

        // Valid current password -> 200 OK
        ChangePasswordRequest validRequest = new ChangePasswordRequest("CurrentPass123!", "NewPassword123!");
        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk());

        User updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("NewPassword123!", updated.getPassword())).isTrue();
    }

    @Test
    @DisplayName("BR-5: Live DB verification rejects requests immediately once user is blocked in DB")
    void testLiveBlockedCheckInJwtFilter() throws Exception {
        // First request is successful
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", userToken))
                .andExpect(status().isOk());

        // Now an admin blocks the user directly in DB
        user.setBlocked(true);
        userRepository.save(user);

        // Next request with the SAME token must be immediately rejected with 403 ACCOUNT_BLOCKED + contact block
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCOUNT_BLOCKED")))
                .andExpect(jsonPath("$.contact.name", is("President Chief")))
                .andExpect(jsonPath("$.contact.email", is("president@wassal.org")))
                .andExpect(jsonPath("$.contact.phone", is("+212600000099")));
    }
}
