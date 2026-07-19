package com.mevis.identity.application;

import java.util.Set;

public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String status;
    private Set<String> roles;
    private Set<String> permissions;

    public UserResponse() {}

    public UserResponse(String id, String username, String email, String status, Set<String> roles, Set<String> permissions) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.status = status;
        this.roles = roles;
        this.permissions = permissions;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
}
