package org.ohdsi.sandbox.auth_windows;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

public class DbAuthFilter extends OncePerRequestFilter {

	private final JwtUtil jwtUtil;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public DbAuthFilter(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain)
			throws ServletException, IOException {

		try {
			// Parse JSON body { "username": "foo", "password": "bar" }
			Map<String, String> creds = objectMapper.readValue(request.getInputStream(), Map.class);
			String username = creds.get("username");
			String password = creds.get("password");

			// todo perform DB lookup of username/password and check it

			// If successful -> issue JWT
			String token = jwtUtil.generateToken(username);
			response.setContentType("application/json");
			response.getWriter().write("{\"token\":\"" + token + "\"}");

		} catch (AuthenticationException ex) {
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setContentType("application/json");
			response.getWriter().write("{\"error\":\"Invalid username or password\"}");
		}
	}
}