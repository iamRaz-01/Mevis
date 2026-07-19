package com.mevis.identity.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface JpaUserSessionRepository extends JpaRepository<UserSessionEntity, String> {
    Optional<UserSessionEntity> findByToken(String token);

    @Modifying
    @Transactional
    @Query("UPDATE UserSessionEntity s SET s.revoked = true WHERE s.userId = :userId AND s.revoked = false")
    void revokeAllByUserId(@Param("userId") String userId);
}
