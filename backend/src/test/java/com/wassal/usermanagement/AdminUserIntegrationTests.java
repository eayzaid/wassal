package com.wassal.usermanagement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wassal.usermanagement.dto.ChangeRoleRequest;
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
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminUserIntegrationTests {

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

    private User president;
    private User vicePresident;
    private User rh;
    private User member;
    private User pendingUser;

    private String presidentToken;
    private String vicePresidentToken;
    private String rhToken;
    private String memberToken;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        resetCodeRepository.deleteAll();
        userRepository.deleteAll();

        president = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("President")
                .email("alice@wassal.org")
                .phoneNumber("+212611111111")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.PRESIDENT)
                .accountStatus(AccountStatus.APPROVED)
                .build());

        vicePresident = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Vice")
                .email("bob@wassal.org")
                .phoneNumber("+212622222222")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.VICE_PRESIDENT)
                .accountStatus(AccountStatus.APPROVED)
                .build());

        rh = userRepository.save(User.builder()
                .firstName("Carol")
                .lastName("HR")
                .email("carol@wassal.org")
                .phoneNumber("+212633333333")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.RH)
                .accountStatus(AccountStatus.APPROVED)
                .build());

        member = userRepository.save(User.builder()
                .firstName("Dave")
                .lastName("Member")
                .email("dave@wassal.org")
                .phoneNumber("+212644444444")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.APPROVED)
                .build());

        pendingUser = userRepository.save(User.builder()
                .firstName("Eve")
                .lastName("Applicant")
                .email("eve@wassal.org")
                .phoneNumber("+212655555555")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(Role.MEMBER)
                .accountStatus(AccountStatus.PENDING_APPROVAL)
                .build());

        presidentToken = "Bearer " + jwtTokenProvider.generateAccessToken(president.getId(), president.getRole());
        vicePresidentToken = "Bearer " + jwtTokenProvider.generateAccessToken(vicePresident.getId(), vicePresident.getRole());
        rhToken = "Bearer " + jwtTokenProvider.generateAccessToken(rh.getId(), rh.getRole());
        memberToken = "Bearer " + jwtTokenProvider.generateAccessToken(member.getId(), member.getRole());
    }

    @Test
    @DisplayName("BR-7: Non-admin member cannot access /api/admin/users")
    void testNonAdminForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", memberToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("FR-8: Admin can list, filter, and search user directory")
    void testAdminListAndFilter() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", presidentToken)
                        .param("role", "MEMBER")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email", is("dave@wassal.org")));

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", presidentToken)
                        .param("q", "Applicant"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email", is("eve@wassal.org")));
    }

    @Test
    @DisplayName("FR-2: Admin can approve a PENDING_APPROVAL user")
    void testApproveUserSuccess() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + pendingUser.getId() + "/approve")
                        .header("Authorization", rhToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus", is("APPROVED")));

        User updated = userRepository.findById(pendingUser.getId()).orElseThrow();
        assertThat(updated.getAccountStatus()).isEqualTo(AccountStatus.APPROVED);
    }

    @Test
    @DisplayName("FR-2 & BR-10: Reject user sets REJECTED status; cannot re-approve/re-reject")
    void testRejectUserTerminal() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + pendingUser.getId() + "/reject")
                        .header("Authorization", presidentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus", is("REJECTED")));

        User updated = userRepository.findById(pendingUser.getId()).orElseThrow();
        assertThat(updated.getAccountStatus()).isEqualTo(AccountStatus.REJECTED);

        // Attempt to approve a rejected user -> fails (BR-10)
        mockMvc.perform(patch("/api/admin/users/" + pendingUser.getId() + "/approve")
                        .header("Authorization", presidentToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_OPERATION")));
    }

    @Test
    @DisplayName("BR-8: Admin cannot perform action (approve/reject/block/role) on self")
    void testCannotPerformActionOnSelf() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + president.getId() + "/block")
                        .header("Authorization", presidentToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_OPERATION")));

        mockMvc.perform(patch("/api/admin/users/" + president.getId() + "/role")
                        .header("Authorization", presidentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangeRoleRequest(Role.MEMBER))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_OPERATION")));
    }

    @Test
    @DisplayName("BR-9: Only PRESIDENT can change role or block a PRESIDENT or VICE_PRESIDENT")
    void testBr9HierarchyEnforcement() throws Exception {
        // RH trying to block VICE_PRESIDENT -> 403 INSUFFICIENT_PRIVILEGE
        mockMvc.perform(patch("/api/admin/users/" + vicePresident.getId() + "/block")
                        .header("Authorization", rhToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("INSUFFICIENT_PRIVILEGE")));

        // VICE_PRESIDENT trying to block PRESIDENT -> 403 INSUFFICIENT_PRIVILEGE
        mockMvc.perform(patch("/api/admin/users/" + president.getId() + "/block")
                        .header("Authorization", vicePresidentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("INSUFFICIENT_PRIVILEGE")));

        // PRESIDENT successfully blocks VICE_PRESIDENT
        mockMvc.perform(patch("/api/admin/users/" + vicePresident.getId() + "/block")
                        .header("Authorization", presidentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocked", is(true)));

        assertThat(userRepository.findById(vicePresident.getId()).orElseThrow().isBlocked()).isTrue();

        // PRESIDENT successfully unblocks VICE_PRESIDENT
        mockMvc.perform(patch("/api/admin/users/" + vicePresident.getId() + "/unblock")
                        .header("Authorization", presidentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocked", is(false)));
    }

    @Test
    @DisplayName("BR-13: RH cannot assign PRESIDENT, VICE_PRESIDENT, or RH role")
    void testBr13RhRestrictedFromAssigningTopTier() throws Exception {
        // RH assigns TEAM_LEADER to member -> OK (subject to BR-6)
        mockMvc.perform(patch("/api/admin/users/" + member.getId() + "/role")
                        .header("Authorization", rhToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangeRoleRequest(Role.TEAM_LEADER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("TEAM_LEADER")));

        // RH attempts to assign PRESIDENT to member -> 403 INSUFFICIENT_PRIVILEGE
        mockMvc.perform(patch("/api/admin/users/" + member.getId() + "/role")
                        .header("Authorization", rhToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangeRoleRequest(Role.PRESIDENT))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("INSUFFICIENT_PRIVILEGE")));

        // RH attempts to assign RH to member -> 403 INSUFFICIENT_PRIVILEGE
        mockMvc.perform(patch("/api/admin/users/" + member.getId() + "/role")
                        .header("Authorization", rhToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangeRoleRequest(Role.RH))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("INSUFFICIENT_PRIVILEGE")));
    }

    @Test
    @DisplayName("BR-6: TEAM_LEADER can only be assigned to an existing MEMBER")
    void testBr6TeamLeaderReachableOnlyFromMember() throws Exception {
        // Attempting to set TEAM_LEADER on VICE_PRESIDENT by PRESIDENT -> fails BR-6
        mockMvc.perform(patch("/api/admin/users/" + vicePresident.getId() + "/role")
                        .header("Authorization", presidentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangeRoleRequest(Role.TEAM_LEADER))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_OPERATION")));
    }
}
