package org.ohdsi.sandbox.spring_authn.session;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sec_user_session")
public class UserSession {

    @Id
    @Column(nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked;

    public UUID getSessionId() {
      return sessionId;
    }

    public void setSessionId(UUID sessionId) {
      this.sessionId = sessionId;
    }

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public Instant getCreatedAt() {
      return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
      this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
      return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
      this.expiresAt = expiresAt;
    }

    public boolean isRevoked() {
      return revoked;
    }

    public void setRevoked(boolean revoked) {
      this.revoked = revoked;
    }
}
