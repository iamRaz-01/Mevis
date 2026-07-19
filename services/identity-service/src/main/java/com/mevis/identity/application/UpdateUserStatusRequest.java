package com.mevis.identity.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateUserStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(ACTIVE|DISABLED)$", message = "Status must be ACTIVE or DISABLED")
    private String status;

    public UpdateUserStatusRequest() {}

    public UpdateUserStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
