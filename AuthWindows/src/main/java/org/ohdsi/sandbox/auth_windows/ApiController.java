package org.ohdsi.sandbox.auth_windows;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

	private final JwtUtil jwtUtil;

	public ApiController(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@GetMapping("/public")
	public String publicEndpoint() {
		return "This is a public endpoint accessible by anyone.";
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/secure")
	public String secureEndpoint() {
		return "This endpoint is secured and requires authentication.";
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/admin")
	public String adminEndpoint() {
		return "Admin-only endpoint.";
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/refresh")
	public Map<String, String> refreshToken() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String token = jwtUtil.generateToken(auth.getName());
		return Map.of("token", token);
	}
	
}