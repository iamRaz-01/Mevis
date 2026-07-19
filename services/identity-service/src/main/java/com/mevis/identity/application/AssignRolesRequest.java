package com.mevis.identity.application;

import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public class AssignRolesRequest {

    @NotEmpty(message = "Roles are required")
    private Set<String> roles;

    private Set<String> permissions;

    public AssignRolesRequest() {}

    public AssignRolesRequest(Set<String> roles, Set<String> permissions) {
        this.roles = roles;
        this.permissions = permissions;
    }

    // Getters and Setters
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
}
