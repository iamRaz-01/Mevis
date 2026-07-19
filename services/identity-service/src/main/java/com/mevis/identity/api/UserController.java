package com.mevis.identity.api;

import com.mevis.identity.application.AssignRolesRequest;
import com.mevis.identity.application.UpdateUserStatusRequest;
import com.mevis.identity.application.UserResponse;
import com.mevis.identity.application.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request.getStatus()));
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<UserResponse> assignRoles(
            @PathVariable String id,
            @Valid @RequestBody AssignRolesRequest request) {
        return ResponseEntity.ok(userService.assignRolesAndPermissions(id, request));
    }
}
