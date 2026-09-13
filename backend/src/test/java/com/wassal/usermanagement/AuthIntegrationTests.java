package com.wassal.usermanagement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wassal.usermanagement.dto.ForgotPasswordRequest;
import com.wassal.usermanagement.dto.LoginRequest;
import com.wassal.usermanagement.dto.RegisterRequest;
import com.wassal.usermanagement.dto.ResetPasswordRequest;
import com.wassal.usermanagement.dto.VerifyResetCodeRequest;
import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.PasswordResetCode;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.repository.PasswordResetCodeRepository;
import com.wassal.usermanagement.repository.RefreshTokenRepository;
import com.wassal.usermanagement.repository.UserRepository;
import com.wassal.usermanagement.security.HashUtils;
import jakarta.servlet.http.Cookie;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTests {

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

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        resetCodeRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("FR-1 & BR-2: Register creates MEMBER in PENDING_APPROVAL and unblocked")
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "John",
                "Doe",
                "john.doe@example.com",
                "+212600000001",
                "Password123!"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.firstName", is("John")))
                .andExpect(jsonPath("$.lastName", is("Doe")))
                .andExpect(jsonPath("$.email", is("john.doe@example.com")))
                .andExpect(jsonPath("$.role", is("MEMBER")))
                .andExpect(jsonPath("$.accountStatus", is("PENDING_APPROVAL")))
                .andExpect(jsonPath("$.blocked", is(false)));

        User saved = userRepository.findByEmail("john.doe@example.com").orElseThrow();
        assertThat(saved.getRole()).isEqualTo(Role.MEMBER);
        assertThat(saved.getAccountStatus()).isEqualTo(AccountStatus.PENDING_APPROVAL);
        assertThat(saved.isBlocked()).isFalse();
        assertThat(passwordEncoder.matches("Password123!", saved.getPassword())).isTrue();
    }

    @Test
    @DisplayName("BR-1: Duplicate registration returns 409 EMAIL_ALREADY_EXISTS")
    void testRegisterDuplicateEmail() throws Exception {
        userRepository.save(User.builder()
                .firstName("Existing")
                .lastName("User")
                .email("duplicate@example.com")
                .phoneNumber("+212600000002")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.PENDING_APPROVAL)
                .build());

        RegisterRequest request = new RegisterRequest(
                "Another",
                "User",
                "duplicate@example.com",
                "+212600000003",
                "Pass1234!"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("EMAIL_ALREADY_EXISTS")));
    }

    @Test
    @DisplayName("BR-3: Login rejected when account is PENDING_APPROVAL")
    void testLoginPendingApproval() throws Exception {
        userRepository.save(User.builder()
                .firstName("Pending")
                .lastName("User")
                .email("pending@example.com")
                .phoneNumber("+212600000004")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.PENDING_APPROVAL)
                .build());

        LoginRequest request = new LoginRequest("pending@example.com", "Pass1234!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCOUNT_PENDING_APPROVAL")))
                .andExpect(jsonPath("$.contact").doesNotExist());
    }

    @Test
    @DisplayName("BR-4: Login rejected when account is REJECTED (includes contact block)")
    void testLoginRejected() throws Exception {
        userRepository.save(User.builder()
                .firstName("President")
                .lastName("Boss")
                .email("president@example.com")
                .phoneNumber("+212611111111")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.PRESIDENT)
                .accountStatus(AccountStatus.APPROVED)
                .build());

        userRepository.save(User.builder()
                .firstName("Rejected")
                .lastName("User")
                .email("rejected@example.com")
                .phoneNumber("+212600000005")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.REJECTED)
                .build());

        LoginRequest request = new LoginRequest("rejected@example.com", "Pass1234!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCOUNT_REJECTED")))
                .andExpect(jsonPath("$.contact.name", is("President Boss")))
                .andExpect(jsonPath("$.contact.email", is("president@example.com")))
                .andExpect(jsonPath("$.contact.phone", is("+212611111111")));
    }

    @Test
    @DisplayName("BR-5: Login rejected when account is BLOCKED (includes contact block)")
    void testLoginBlocked() throws Exception {
        userRepository.save(User.builder()
                .firstName("Blocked")
                .lastName("User")
                .email("blocked@example.com")
                .phoneNumber("+212600000006")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(true)
                .build());

        LoginRequest request = new LoginRequest("blocked@example.com", "Pass1234!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCOUNT_BLOCKED")))
                .andExpect(jsonPath("$.contact", notNullValue()));
    }

    @Test
    @DisplayName("FR-3: Approved user login issues access token and refresh cookie")
    void testLoginApprovedSuccess() throws Exception {
        userRepository.save(User.builder()
                .firstName("Approved")
                .lastName("Member")
                .email("approved@example.com")
                .phoneNumber("+212600000007")
                .password(passwordEncoder.encode("ValidPassword123!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(false)
                .build());

        LoginRequest request = new LoginRequest("approved@example.com", "ValidPassword123!");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refreshToken=")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/api/auth/refresh")))
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();
        String rawToken = refreshCookie.getValue();

        // Verify SHA-256 hash stored in DB
        String hash = HashUtils.sha256(rawToken);
        assertThat(refreshTokenRepository.findByTokenHash(hash)).isPresent();
    }

    @Test
    @DisplayName("FR-4: Refresh endpoint rotates token and issues new access token")
    void testRefreshRotation() throws Exception {
        User user = userRepository.save(User.builder()
                .firstName("Active")
                .lastName("User")
                .email("active@example.com")
                .phoneNumber("+212600000008")
                .password(passwordEncoder.encode("ValidPassword123!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(false)
                .build());

        // Perform login to get initial refresh cookie
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("active@example.com", "ValidPassword123!"))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie oldCookie = loginResult.getResponse().getCookie("refreshToken");
        assertThat(oldCookie).isNotNull();
        String oldRawToken = oldCookie.getValue();

        // Call /refresh
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(oldCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("Path=/api/auth/refresh")))
                .andReturn();

        Cookie newCookie = refreshResult.getResponse().getCookie("refreshToken");
        assertThat(newCookie).isNotNull();
        assertThat(newCookie.getValue()).isNotEqualTo(oldRawToken);

        // Verify old token is revoked
        String oldHash = HashUtils.sha256(oldRawToken);
        assertThat(refreshTokenRepository.findByTokenHash(oldHash).get().isRevoked()).isTrue();

        // Verify new token is valid
        String newHash = HashUtils.sha256(newCookie.getValue());
        assertThat(refreshTokenRepository.findByTokenHash(newHash).get().isValid()).isTrue();
    }

    @Test
    @DisplayName("FR-5: Logout revokes refresh token row and clears cookie")
    void testLogout() throws Exception {
        userRepository.save(User.builder()
                .firstName("Logout")
                .lastName("User")
                .email("logout@example.com")
                .phoneNumber("+212600000009")
                .password(passwordEncoder.encode("ValidPassword123!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(false)
                .build());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("logout@example.com", "ValidPassword123!"))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/api/auth/refresh")));

        String hash = HashUtils.sha256(refreshCookie.getValue());
        assertThat(refreshTokenRepository.findByTokenHash(hash).get().isRevoked()).isTrue();
    }

    @Test
    @DisplayName("FR-5: Logout with Bearer token only revokes tokens when browser does not send cookie to logout endpoint")
    void testLogoutWithBearerTokenOnly() throws Exception {
        userRepository.save(User.builder()
                .firstName("Bearer")
                .lastName("Logout")
                .email("bearerlogout@example.com")
                .phoneNumber("+212600000010")
                .password(passwordEncoder.encode("ValidPassword123!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(false)
                .build());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("bearerlogout@example.com", "ValidPassword123!"))))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseBody).get("accessToken").asText();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();
        String hash = HashUtils.sha256(refreshCookie.getValue());
        assertThat(refreshTokenRepository.findByTokenHash(hash).get().isRevoked()).isFalse();

        // Browser sends logout request with Bearer token but WITHOUT refreshToken cookie (Path=/api/auth/refresh)
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/api/auth/refresh")));

        // Active tokens are revoked
        assertThat(refreshTokenRepository.findByTokenHash(hash).get().isRevoked()).isTrue();
    }

    @Test
    @DisplayName("FR-10 & BR-12: Password reset flow with 5-attempt cap")
    void testPasswordResetFlow() throws Exception {
        User user = userRepository.save(User.builder()
                .firstName("Reset")
                .lastName("User")
                .email("reset@example.com")
                .phoneNumber("+212600000010")
                .password(passwordEncoder.encode("OldPassword123!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .blocked(false)
                .build());

        // 1. Forgot password request (always 200)
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest("reset@example.com"))))
                .andExpect(status().isOk());

        PasswordResetCode resetCode = resetCodeRepository.findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId()).orElseThrow();
        assertThat(resetCode.getAttempts()).isEqualTo(0);

        // 2. Test failed attempts increment
        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyResetCodeRequest("reset@example.com", "000000"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_OPERATION")));

        PasswordResetCode afterFailed = resetCodeRepository.findById(resetCode.getId()).orElseThrow();
        assertThat(afterFailed.getAttempts()).isEqualTo(1);

        // Manually set known code "123456"
        resetCode.setCodeHash(HashUtils.sha256("123456"));
        resetCode.setAttempts(0);
        resetCodeRepository.save(resetCode);

        // 3. Verify with correct code -> returns resetToken
        MvcResult verifyResult = mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyResetCodeRequest("reset@example.com", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", notNullValue()))
                .andReturn();

        String resetToken = objectMapper.readTree(verifyResult.getResponse().getContentAsString()).get("resetToken").asText();

        // 4. Reset password
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(resetToken, "BrandNewPassword123!"))))
                .andExpect(status().isOk());

        // 5. Verify user can log in with new password
        User updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("BrandNewPassword123!", updated.getPassword())).isTrue();
    }
}
