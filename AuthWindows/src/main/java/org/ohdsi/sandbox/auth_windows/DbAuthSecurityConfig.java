package org.ohdsi.sandbox.auth_windows;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
@ConditionalOnProperty(prefix = "app.auth.db", name = "enabled", havingValue = "true")
public class DbAuthSecurityConfig {

	@Bean
	@Order(1)
	public SecurityFilterChain dbChain(HttpSecurity http, JwtUtil jwtUtil) throws Exception {
		http
				.securityMatcher("/user/login/db") // Only applies to this endpoint
				.csrf(csrf -> csrf.disable()) // Disable CSRF (not needed for REST)
				.cors(cors -> {
				}) // Enable CORS if your SPA needs it
				.formLogin(AbstractHttpConfigurer::disable) // No HTML login form
				.httpBasic(AbstractHttpConfigurer::disable) // No Basic auth
				.logout(AbstractHttpConfigurer::disable) // No logout endpoint
				.authorizeHttpRequests(authz -> authz.anyRequest().permitAll())
				.addFilterBefore(dbAuthFilter(jwtUtil), BasicAuthenticationFilter.class);
		return http.build();
	}

	public DbAuthFilter dbAuthFilter(JwtUtil jwtUtil) {
		return new DbAuthFilter(jwtUtil);
	}
}