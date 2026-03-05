package org.ohdsi.sandbox.spring_authn.security.authc.db;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

public class DatabaseUser {

    private final String username;
    private final String passwordHash;
    private final boolean enabled;
    private final int failedAttempts;
    private final LocalDateTime lockedUntil;

    public DatabaseUser(String username, String passwordHash, boolean enabled,
                    int failedAttempts, LocalDateTime lockedUntil) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.failedAttempts = failedAttempts;
        this.lockedUntil = lockedUntil;
    }

    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEnabled() { return enabled; }
    public int getFailedAttempts() { return failedAttempts; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }

    public Collection<GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    public boolean isAccountLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }
}
