package com.mevis.identity.infrastructure;

import com.mevis.identity.domain.User;
import com.mevis.identity.domain.UserRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if ("DISABLED".equals(user.getStatus())) {
            throw new DisabledException("User account is disabled");
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // Add roles as SimpleGrantedAuthority (e.g. ROLE_ADMIN)
        for (String role : user.getRoles()) {
            authorities.add(new SimpleGrantedAuthority(role));
        }

        // Add permissions as SimpleGrantedAuthority (e.g. manage_users)
        for (String permission : user.getPermissions()) {
            authorities.add(new SimpleGrantedAuthority(permission));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                authorities
        );
    }
}
