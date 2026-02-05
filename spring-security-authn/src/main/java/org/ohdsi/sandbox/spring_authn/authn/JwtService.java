package org.ohdsi.sandbox.spring_authn.authn;

import java.time.Instant;
import java.util.Date;

import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

@Component
public class JwtService {

    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(String username, String sessionId, Date expiresAt) {

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(username)
                .issuedAt(Instant.now())
                .expiresAt(expiresAt.toInstant())
                .claim("sid", sessionId)
                .build();

        JwsHeader header = JwsHeader
                .with(JwtAuthConfig.JWT_ALGORITHM)
                .build();

        return jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();
    }
}