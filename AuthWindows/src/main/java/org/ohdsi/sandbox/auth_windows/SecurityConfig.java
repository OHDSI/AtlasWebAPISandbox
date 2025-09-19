package org.ohdsi.sandbox.auth_windows;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public JwtUtil jwtUtil() {
		return new JwtUtil();
	}

	@Bean
	public JwtAuthenticationFilter jwtAuthenticationFilter(AuthenticationManager authenticationManager) {
		return new JwtAuthenticationFilter(authenticationManager);
	}

	@Bean
	public UserDetailsService userDetailsService(PasswordEncoder encoder) {
		var uds = new InMemoryUserDetailsManager();
		uds.createUser(User.withUsername("alice")
				.password(encoder.encode("password"))
				.roles("USER")
				.build());
		return uds;
	}

	// this is the Spring default behavior to create a ProviderManger of all registered AuthenticationProviders, but 
	// am including it here in case we need special handling for the configuration.
	// In addition, there should only be one authentication provider to authenticate JWT tokens becuase that's the
	// canoical authentication context that leads to the security principle in spring security
	// ie: we do not carry around an OAUth authenticated user, windows authenticated user, etc.
	// Authentication endpionts lead to minting JWT tokens, which will be used to identify the authenticated user from all the 
	// different authentication endpints that are enabled.
	@Bean
	public AuthenticationManager authenticationManager(List<AuthenticationProvider> providers) {
		return new ProviderManager(providers);
	}

	@Bean
	@Order(100)
	public SecurityFilterChain apiChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				// disable unecessary filters
				.requestCache(AbstractHttpConfigurer::disable)
				.sessionManagement(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.anonymous(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)				// JWT filter tries to authenticate first
				// Allow ALL requests at the filter level
				.authorizeHttpRequests(auth -> auth
						.anyRequest().permitAll())
				.addFilterBefore(jwtFilter, AnonymousAuthenticationFilter.class)
				// If JWT didn’t populate SecurityContext, set anonymous
				.anonymous(anon -> anon
						.principal("anonymous"));

		return http.build();
	}
}