package com.mevis.identity.application;

import com.mevis.identity.domain.*;
import com.mevis.identity.infrastructure.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(UserRepository userRepository, UserSessionRepository userSessionRepository,
                           PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if ("DISABLED".equals(user.getStatus())) {
            throw new IllegalArgumentException("User account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        // Revoke all previous active sessions to prevent concurrent reuse (optional, but requested in lifecycle)
        userSessionRepository.revokeAllByUserId(user.getId());

        // Generate JWT Token
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRoles(), user.getPermissions());
        Date expDate = jwtTokenProvider.getExpirationDateFromToken(token);
        LocalDateTime expiresAt = expDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();

        // Create new active session record
        UserSession session = new UserSession(
                UUID.randomUUID().toString(),
                user.getId(),
                token,
                false,
                expiresAt,
                LocalDateTime.now()
        );
        userSessionRepository.save(session);

        return new AuthResponse(
                token,
                expiresAt.toString(),
                user.getUsername(),
                user.getRoles(),
                user.getPermissions()
        );
    }

    @Override
    public void logout(String token) {
        userSessionRepository.findByToken(token).ifPresent(session -> {
            session.setRevoked(true);
            userSessionRepository.save(session);
        });
    }

    @Override
    public boolean validateToken(String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            return false;
        }

        // Check if token session has been revoked in database
        return userSessionRepository.findByToken(token)
                .map(session -> !session.isRevoked() && session.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }
}
