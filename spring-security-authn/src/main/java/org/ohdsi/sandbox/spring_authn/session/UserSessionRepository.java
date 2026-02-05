package org.ohdsi.sandbox.spring_authn.session;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

  @Query("""
          select count(s) > 0
          from UserSession s
          where s.username = :username
            and s.sessionId = :sessionId
            and s.revoked = false
            and s.expiresAt > :now
      """)
  boolean isSessionValid(
      String username,
      UUID sessionId,
      Instant now);

  @Modifying
  @Query("""
          update UserSession s
          set s.revoked = true
          where s.username = :username
      """)
  void revokeByUsername(String username);

  @Modifying
  @Query("""
          update UserSession s
          set s.revoked = true
          where s.sessionId = :sessionId
      """)
  void revokeBySessionId(UUID sessionId);

  @Modifying
  @Query("""
          delete from UserSession s
          where s.expiresAt < :now
      """)
  void deleteByExpiresAtBefore(Instant now);

    @Query("""
        select count(s)
        from UserSession s
        where s.expiresAt < :now
    """)
    long countByExpiresAtBefore(Instant now);

    @Query("""
        select count(s)
        from UserSession s
        where s.expiresAt > :now
    """)
    long countByExpiresAtAfter(Instant now);    

}
