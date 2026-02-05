package org.ohdsi.sandbox.spring_authn.authn;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import org.ohdsi.sandbox.spring_authn.session.SessionProperties;
import org.ohdsi.sandbox.spring_authn.session.UserSessionStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

  public record Result(
      String username,
      String jwt,
      String[] roles,
      String message) {
  }

  private final UserSessionStore sessionStore;
  private final JwtService jwtService;
  private final SessionProperties sessionProps;

  private static final Logger log = LoggerFactory.getLogger(LoginService.class);

  public LoginService(
      UserSessionStore sessionStore,
      JwtService jwtService,
      SessionProperties sessionProps) {
    this.sessionStore = sessionStore;
    this.jwtService = jwtService;
    this.sessionProps = sessionProps;
  }

  public Result onSuccess(Authentication authentication) {

    String username = authentication.getName();
    log.info("LoginService: onSuccess: " + username);

    String[] roles = authentication.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .toArray(String[]::new);

    // Generate a unique session ID and store session
    UUID sessionId = sessionStore.createSession(username);

    // Calculate expiration for JWT (same as session)
    Instant expiresAt = Instant.now().plus(sessionProps.getExpiration());

    // mint the JWT
    String jwt = jwtService.generateToken(username, sessionId.toString(), Date.from(expiresAt));

    return new Result(username, jwt, roles, "Login successful");
  }

  /**
   * extends the authenticated session by minting a new JWT, and extending the
   * session in the session store.
   * 
   * @param authentication
   * @return
   */
  public Result extend(Authentication authentication) {

    // all non-authN requests should have a JWT token as the authenticated identity,
    // so this may be redundant:
    if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
      throw new BadCredentialsException("Invalid authentication type");
    }
    Jwt currentJwt = jwtAuth.getToken();
    String username = currentJwt.getSubject();
    String sessionId = currentJwt.getClaimAsString("sid");
    Instant expiresAt = Instant.now().plus(sessionProps.getExpiration());
    String[] roles = authentication.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .toArray(String[]::new);

    // extend session
    sessionStore.extendSession(UUID.fromString(sessionId), expiresAt);

    // mint the JWT
    String jwt = jwtService.generateToken(currentJwt.getSubject(), sessionId.toString(), Date.from(expiresAt));

    return new Result(username, jwt, roles, "Refreshed Token in for session");
  }

  // Since login service initiates sessions, it can determine the cleanup schedule
  @Scheduled(fixedRateString = "#{@sessionProperties.cleanupInterval.toMillis()}")
  public void cleanupSessions() {
    sessionStore.cleanupExpiredSessions();
  }

}
