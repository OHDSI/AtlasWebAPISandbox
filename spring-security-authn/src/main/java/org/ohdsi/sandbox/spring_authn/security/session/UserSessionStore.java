package org.ohdsi.sandbox.spring_authn.security.session;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class UserSessionStore {

  private final UserSessionRepository repo;
  private final SessionProperties props;

  // Flag to avoid unnecessary cleanup DB hits
  private boolean cleanupRequired = false;

  private static final Logger log = LoggerFactory.getLogger(UserSessionStore.class);

  public UserSessionStore(
      UserSessionRepository repo,
      SessionProperties props) {

    this.repo = repo;
    this.props = props;
  }

  // ---- Create/Extend session

  public UUID createSession(String username) {

    if (props.isSingleLogin()) {
      repo.revokeByUsername(username);
      log.debug("Revoking sessions for: {}", username);
    }

    UUID sessionId = UUID.randomUUID();
    Instant now = Instant.now();
    Instant expiresAt = now.plus(props.getExpiration());

    UserSession session = new UserSession();
    session.setSessionId(sessionId);
    session.setUsername(username);
    session.setCreatedAt(now);
    session.setExpiresAt(expiresAt);
    session.setRevoked(false);

    repo.save(session);
    this.cleanupRequired = true;
    log.debug("Session: {} created for: {}", sessionId, username);

    return sessionId;
  }

  public void extendSession(UUID sessionId, Instant newExpiresAt) {
    repo.findById(sessionId).ifPresent(session -> {
      session.setExpiresAt(newExpiresAt);
      repo.save(session);
      cleanupRequired = true;
    });
    log.debug("Session: {} extended to: {}", sessionId, newExpiresAt);

  }

  // --- Revoke / Validation

  public boolean isSessionValid(String username, UUID sessionId) {
    return repo.isSessionValid(username, sessionId, Instant.now());
  }

  public void revokeSession(UUID sessionId) {
    repo.revokeBySessionId(sessionId);
    cleanupRequired = true;
    log.debug("Session: {} revoked.", sessionId);
  }

  public void revokeUserSessions(String username) {
    repo.revokeByUsername(username);
    cleanupRequired = true;
    log.debug("Sessions for user: {} revoked.", username);
  }

  // --- Cleanup Sessions ---

  public void cleanupExpiredSessions() {
    if (!cleanupRequired)
      return;
    repo.deleteByExpiresAtBefore(Instant.now());

    // Count remaining active sessions
    long remainingSessions = repo.countByExpiresAtAfter(Instant.now());
    cleanupRequired = remainingSessions > 0;

    log.debug("Cleanup for expired sessions completed. Remaining active sessions: {}", remainingSessions);

  }

}
