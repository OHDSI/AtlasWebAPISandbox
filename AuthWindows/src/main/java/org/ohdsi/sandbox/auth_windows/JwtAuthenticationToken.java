package org.ohdsi.sandbox.auth_windows;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public class JwtAuthenticationToken implements Authentication {

    private final String token;
    private boolean authenticated = false;
    private String principal;

    public JwtAuthenticationToken(String token) {
        this.token = token;
    }

    public JwtAuthenticationToken(String token, String principal) {
        this.token = token;
        this.principal = principal;
        this.authenticated = true;
    }

    @Override
    public String getName() {
        return principal;
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // or populate roles if you extract them from the token
    }

    @Override
    public boolean isAuthenticated() {
        return authenticated;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        this.authenticated = isAuthenticated;
    }

    @Override
    public Object getDetails() {
        return null;
    }
}