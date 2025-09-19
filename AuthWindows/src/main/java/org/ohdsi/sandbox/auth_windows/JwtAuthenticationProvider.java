package org.ohdsi.sandbox.auth_windows;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationProvider implements AuthenticationProvider {

	private final JwtUtil jwtUtil;

	public JwtAuthenticationProvider(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		String token = (String) authentication.getCredentials();

		if (!jwtUtil.validateToken(token))
			throw new BadCredentialsException("Invalid JWT token");

		String username = jwtUtil.extractUsername(token);

		// Return an authenticated token
		JwtAuthenticationToken auth = new JwtAuthenticationToken(token, username);
		auth.setAuthenticated(true);
		return auth;
	}

	@Override
	public boolean supports(Class<?> authentication) {
		return JwtAuthenticationToken.class.isAssignableFrom(authentication);
	}
}
