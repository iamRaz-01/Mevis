package com.mevis.identity.application;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    void logout(String token);
    boolean validateToken(String token);
}
