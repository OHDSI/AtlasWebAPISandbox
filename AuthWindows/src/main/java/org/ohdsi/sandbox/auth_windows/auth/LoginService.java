package org.ohdsi.sandbox.auth_windows.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    public record Result(
            String username,
            String jwt,
            String[] roles,
            String message) {
    }

    private final JwtService jwtService; // your service that mints JWTs
    private static final Logger log = LoggerFactory.getLogger(LoginService.class);

    public LoginService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public Result onSuccess(Authentication authentication) {

        String username = authentication.getName();
        log.info("LoginService: onSuccess: " + username);

        String[] roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toArray(String[]::new);

        // mint the JWT
        String token = jwtService.generateToken(username);

        return new Result(username, token, roles, "Login successful");
    }

}