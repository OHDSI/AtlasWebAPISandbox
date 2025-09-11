package org.ohdsi.sandbox.auth_windows;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.StringUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Key;
import java.util.List;
import java.util.stream.Collectors;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	// Secret key for signing/verifying tokens; replace with your secure key
	private final String secretKey = "your-256-bit-secret-your-256-bit-secret"; // 32+ characters
	private final Key key = Keys.hmacShaKeyFor(secretKey.getBytes());

	@Override
	protected void doFilterInternal(HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		String authHeader = request.getHeader("Authorization");

		if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
			String token = authHeader.substring(7);

			try {
				// Parse and validate JWT token
				Claims claims = Jwts.parserBuilder()
						.setSigningKey(key)
						.build()
						.parseClaimsJws(token)
						.getBody();

				// Extract username (subject) and roles
				String username = claims.getSubject();

				@SuppressWarnings("unchecked")
				List<String> authorities = (List<String>) claims.get("roles");

				// Map roles to authorities
				List<SimpleGrantedAuthority> auths = authorities.stream()
						.map(SimpleGrantedAuthority::new)
						.collect(Collectors.toList());

				// Build Authentication object
				Authentication authentication = new UsernamePasswordAuthenticationToken(
						username,
						null,
						auths);

				// Set authentication in context
				SecurityContextHolder.getContext().setAuthentication(authentication);

			} catch (JwtException e) {
				// Log token invalidity
				logger.warn("Invalid JWT token: {}", e.getMessage());
			}
		}

		// Proceed with filter chain
		filterChain.doFilter(request, response);
	}
}