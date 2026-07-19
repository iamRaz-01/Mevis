package com.mevis.identity.application;

import com.mevis.identity.domain.User;
import java.util.List;

public interface UserService {
    UserResponse registerUser(RegisterRequest request);
    UserResponse getUserById(String id);
    UserResponse getUserByUsername(String username);
    List<UserResponse> getAllUsers();
    UserResponse updateUserStatus(String id, String status);
    UserResponse assignRolesAndPermissions(String id, AssignRolesRequest request);
}
