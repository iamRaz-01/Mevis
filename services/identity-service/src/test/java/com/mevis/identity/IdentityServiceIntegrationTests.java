package com.mevis.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mevis.identity.application.*;
import com.mevis.identity.domain.User;
import com.mevis.identity.domain.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class IdentityServiceIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        // Clean up or seed if necessary
    }

    @Test
    public void testCompleteSecurityWorkflow() throws Exception {
        String testUser = "user_" + System.currentTimeMillis();
        String testEmail = testUser + "@mevis.com";
        String testPassword = "securePassword123";

        // 1. Register a new user
        RegisterRequest registerRequest = new RegisterRequest(testUser, testEmail, testPassword);
        String registerJson = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(testUser))
                .andExpect(jsonPath("$.email").value(testEmail))
                .andReturn().getResponse().getContentAsString();

        UserResponse userResponse = objectMapper.readValue(registerJson, UserResponse.class);
        assertNotNull(userResponse.getId());

        // 2. Login to get an authentication token
        LoginRequest loginRequest = new LoginRequest(testUser, testPassword);
        String loginJson = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();

        AuthResponse authResponse = objectMapper.readValue(loginJson, AuthResponse.class);
        String token = authResponse.getToken();
        assertNotNull(token);

        // 3. Request verification endpoint with the token
        mockMvc.perform(get("/api/auth/verify")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value(testUser));

        // 4. Try to access verification endpoint without token (should fail)
        mockMvc.perform(get("/api/auth/verify"))
                .andExpect(status().isForbidden());

        // 5. Try to access admin users endpoint with the non-admin token (should fail)
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // 6. Access admin endpoint with bad token (should fail)
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer invalidToken123"))
                .andExpect(status().isForbidden());

        // 7. Login with bad credentials (should fail)
        LoginRequest badLoginRequest = new LoginRequest(testUser, "wrongPassword");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badLoginRequest)))
                .andExpect(status().isUnauthorized());

        // 8. Grant ADMIN role to the user directly in database to test role transitions
        User domainUser = userRepository.findById(userResponse.getId()).orElseThrow();
        domainUser.setRoles(Set.of("ROLE_ADMIN"));
        domainUser.setPermissions(Set.of("manage_users"));
        userRepository.save(domainUser);

        // Login again to get token with new roles
        String newLoginJson = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        AuthResponse adminAuthResponse = objectMapper.readValue(newLoginJson, AuthResponse.class);
        String adminToken = adminAuthResponse.getToken();

        // Access admin endpoint with new admin token (should succeed)
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 9. Logout (revokes session)
        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Try to access verification with revoked token (should fail)
        mockMvc.perform(get("/api/auth/verify")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }
}
