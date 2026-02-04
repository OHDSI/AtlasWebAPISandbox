package org.ohdsi.sandbox.spring_authn.auth;

import java.time.Instant;

import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

@Component
public class JwtService {

    private static final long JWT_EXPIRATION_MS = 3600_000;

    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(String username) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(username)
                .issuedAt(now)
                .expiresAt(now.plusMillis(JWT_EXPIRATION_MS))
                .build();

        JwsHeader header = JwsHeader
                .with(JwtAuthConfig.JWT_ALGORITHM)
                .build();

        return jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();
    }
}