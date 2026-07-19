package com.mevis.identity.domain;

import java.util.Optional;

public interface UserSessionRepository {
    Optional<UserSession> findById(String id);
    Optional<UserSession> findByToken(String token);
    UserSession save(UserSession session);
    void revokeAllByUserId(String userId);
}
