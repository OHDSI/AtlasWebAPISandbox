package org.ohdsi.sandbox.spring_authn.auth;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class JwtAuthConfig {

  public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS256;

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
				// disable unecessary filters
				.requestCache(AbstractHttpConfigurer::disable)
				.sessionManagement(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable) // JWT filter tries to authenticate first
				// Allow ALL requests at the filter level
				.authorizeHttpRequests(auth -> auth
						.anyRequest().permitAll())
				.oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
				// If JWT didn’t populate SecurityContext, set anonymous
				.anonymous(anon -> anon
						.principal("anonymous"));

		return http.build();
	}
}