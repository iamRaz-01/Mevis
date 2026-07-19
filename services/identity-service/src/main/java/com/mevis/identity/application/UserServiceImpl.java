package com.mevis.identity.application;

import com.mevis.identity.domain.User;
import com.mevis.identity.domain.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Role-to-Permissions static mapping for RBAC inheritance
    private static final Map<String, Set<String>> ROLE_PERMISSIONS_MAP = new HashMap<>();

    static {
        ROLE_PERMISSIONS_MAP.put("ROLE_ADMIN", Set.of(
                "manage_users", "view_operational_dashboard", "create_incident", 
                "assign_volunteer", "upload_knowledge", "access_analytics"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_EVENT_COORDINATOR", Set.of(
                "view_operational_dashboard", "create_incident", "assign_volunteer", 
                "upload_knowledge", "access_analytics"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_VOLUNTEER_COORDINATOR", Set.of(
                "view_operational_dashboard", "assign_volunteer"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_VOLUNTEER", Set.of(
                "view_operational_dashboard"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_MEDICAL", Set.of(
                "view_operational_dashboard", "create_incident"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_SECURITY", Set.of(
                "view_operational_dashboard", "create_incident"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_OBSERVER", Set.of(
                "view_operational_dashboard"
        ));
        ROLE_PERMISSIONS_MAP.put("ROLE_AI_AGENT", Set.of(
                "view_operational_dashboard", "access_analytics"
        ));
    }

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        String userId = UUID.randomUUID().toString();
        Set<String> defaultRoles = Set.of("ROLE_OBSERVER"); // Default fallback role
        Set<String> inheritedPermissions = getPermissionsForRoles(defaultRoles);

        User user = new User(
                userId,
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                "ACTIVE",
                defaultRoles,
                inheritedPermissions,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return toResponse(user);
    }

    @Override
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return toResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public UserResponse updateUserStatus(String id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        
        user.setStatus(status);
        user.setUpdatedAt(LocalDateTime.now());
        
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public UserResponse assignRolesAndPermissions(String id, AssignRolesRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        user.setRoles(request.getRoles());
        
        // Merge explicit permissions and inherited permissions from roles
        Set<String> permissions = new HashSet<>(getPermissionsForRoles(request.getRoles()));
        if (request.getPermissions() != null) {
            permissions.addAll(request.getPermissions());
        }
        user.setPermissions(permissions);
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    private Set<String> getPermissionsForRoles(Set<String> roles) {
        Set<String> permissions = new HashSet<>();
        for (String role : roles) {
            Set<String> rolePerms = ROLE_PERMISSIONS_MAP.get(role);
            if (rolePerms != null) {
                permissions.addAll(rolePerms);
            }
        }
        return permissions;
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getStatus(),
                user.getRoles(),
                user.getPermissions()
        );
    }
}
