package org.ohdsi.sandbox.auth_windows;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@ConditionalOnProperty(prefix = "app.auth.windows", name = "enabled", havingValue = "true")
public class WindowsAuthSecurityConfig {

	@Bean
	@Order(1)
	public SecurityFilterChain windowsAuthChain(HttpSecurity http, JwtUtil jwtUtil,
			CorsConfigurationSource corsConfigurationSource) throws Exception {

		http
				.securityMatcher("/user/login/windows")
				.csrf(AbstractHttpConfigurer::disable)
				.cors(cors -> cors.configurationSource(corsConfigurationSource))
				// Disable all unecessary filters
				.requestCache(AbstractHttpConfigurer::disable)
				.sessionManagement(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.anonymous(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.authorizeHttpRequests(authz -> authz.anyRequest().permitAll())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(
								(req, res, excep) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)
						)
				)
				.addFilterAfter(windowsAuthFilter(jwtUtil), CorsFilter.class);

		return http.build();
	}

	private WindowsAuthFilter windowsAuthFilter(JwtUtil jwtUtil) {
		WindowsAuthFilter filter = new WindowsAuthFilter(jwtUtil);
		return filter;
	}
}
