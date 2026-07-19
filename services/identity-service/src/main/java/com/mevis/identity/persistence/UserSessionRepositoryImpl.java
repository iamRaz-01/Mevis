package com.mevis.identity.persistence;

import com.mevis.identity.domain.UserSession;
import com.mevis.identity.domain.UserSessionRepository;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class UserSessionRepositoryImpl implements UserSessionRepository {

    private final JpaUserSessionRepository jpaUserSessionRepository;

    public UserSessionRepositoryImpl(JpaUserSessionRepository jpaUserSessionRepository) {
        this.jpaUserSessionRepository = jpaUserSessionRepository;
    }

    @Override
    public Optional<UserSession> findById(String id) {
        return jpaUserSessionRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<UserSession> findByToken(String token) {
        return jpaUserSessionRepository.findByToken(token).map(this::toDomain);
    }

    @Override
    public UserSession save(UserSession session) {
        UserSessionEntity entity = toEntity(session);
        UserSessionEntity saved = jpaUserSessionRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void revokeAllByUserId(String userId) {
        jpaUserSessionRepository.revokeAllByUserId(userId);
    }

    private UserSession toDomain(UserSessionEntity entity) {
        return new UserSession(
                entity.getId(),
                entity.getUserId(),
                entity.getToken(),
                entity.isRevoked(),
                entity.getExpiresAt(),
                entity.getCreatedAt()
        );
    }

    private UserSessionEntity toEntity(UserSession session) {
        UserSessionEntity entity = new UserSessionEntity();
        entity.setId(session.getId());
        entity.setUserId(session.getUserId());
        entity.setToken(session.getToken());
        entity.setRevoked(session.isRevoked());
        entity.setExpiresAt(session.getExpiresAt());
        entity.setCreatedAt(session.getCreatedAt());
        return entity;
    }
}
