package com.mevis.identity.domain;

import java.util.Optional;
import java.util.List;

public interface UserRepository {
    Optional<User> findById(String id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    User save(User user);
    List<User> findAll();
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
