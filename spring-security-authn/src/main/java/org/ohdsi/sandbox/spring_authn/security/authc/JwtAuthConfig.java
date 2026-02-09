package org.ohdsi.sandbox.spring_authn.security.authc;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.ohdsi.sandbox.spring_authn.security.identity.WebApiPrincipal;
import org.ohdsi.sandbox.spring_authn.security.session.UserSessionStore;
import org.ohdsi.sandbox.spring_authn.security.user.UserEntity;
import org.ohdsi.sandbox.spring_authn.security.user.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableScheduling
public class JwtAuthConfig {

  public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS256;
  private final UserSessionStore userSessionStore;
  private final UserRepository userRepository;

  // Constructor now injects both session store and user repository
  public JwtAuthConfig(UserSessionStore userSessionStore, UserRepository userRepository) {
    this.userSessionStore = userSessionStore;
    this.userRepository = userRepository;
  }

  @Bean
  public SecretKey jwtSecretKey() {
    return new SecretKeySpec(
        "super-secret-key-super-secret-key".getBytes(),
        JWT_ALGORITHM.getName() // maps to HmacSHA256
    );
  }

  @Bean
  public JwtEncoder jwtEncoder(SecretKey secretKey) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
  }

  @Bean
  public JwtDecoder jwtDecoder(SecretKey secretKey) {
    return NimbusJwtDecoder
        .withSecretKey(secretKey)
        .macAlgorithm(JWT_ALGORITHM)
        .build();
  }

  @Bean
  @Order(100)
  public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {

    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        // Disable unneeded filters
        .requestCache(AbstractHttpConfigurer::disable)
        .sessionManagement(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        // Allow all requests at the filter level; authorization handled downstream
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        // Configure JWT authentication
        .oauth2ResourceServer(oauth -> oauth
            .jwt(jwt -> jwt.jwtAuthenticationConverter(
                new JwtToWebApiAuthenticationConverter(userSessionStore, userRepository))))
        // Fallback to anonymous if JWT not present
        .anonymous(anon -> anon
            .principal(WebApiPrincipal.ANONYMOUS)
            .authorities(List.of()));

    return http.build();
  }

  /**
   * Converts a decoded JWT into a WebApiAuthenticationToken while performing
   * session validation.
   */
  private static class JwtToWebApiAuthenticationConverter
      implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserSessionStore userSessionStore;
    private final UserRepository userRepository;

    // Constructor now takes both dependencies
    public JwtToWebApiAuthenticationConverter(UserSessionStore userSessionStore,
        UserRepository userRepository) {
      this.userSessionStore = Objects.requireNonNull(userSessionStore, "userSessionStore");
      this.userRepository = Objects.requireNonNull(userRepository, "userRepository");
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
      String username = jwt.getSubject();
      String sessionId = jwt.getClaimAsString("sid");

      // Validate session (single-login / multi-login policy)
      UUID sessionUuid;
      try {
        sessionUuid = UUID.fromString(sessionId);
      } catch (IllegalArgumentException e) {
        throw new BadCredentialsException("Invalid session ID in JWT", e);
      }

      if (!userSessionStore.isSessionValid(username, sessionUuid)) {
        throw new BadCredentialsException("Session invalid or revoked");
      }

      // Lookup the user in your system
      UserEntity user = userRepository.findByLogin(username);
      if (user == null) {
        throw new BadCredentialsException("User not found: " + username);
      }

      // Build principal and authentication token
      WebApiPrincipal principal = new WebApiPrincipal(user.getId(), user.getLogin());

      Collection<GrantedAuthority> authorities = List.of(); // populate as needed

      return WebApiAuthenticationToken.authenticated(principal, sessionUuid, authorities);
    }
  }
}