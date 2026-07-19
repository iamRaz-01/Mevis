package com.mevis.identity.application;

import java.util.Set;

public class AuthResponse {
    private String token;
    private String expiresAt;
    private String username;
    private Set<String> roles;
    private Set<String> permissions;

    public AuthResponse() {}

    public AuthResponse(String token, String expiresAt, String username, Set<String> roles, Set<String> permissions) {
        this.token = token;
        this.expiresAt = expiresAt;
        this.username = username;
        this.roles = roles;
        this.permissions = permissions;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
}
