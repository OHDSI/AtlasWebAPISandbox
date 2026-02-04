package org.ohdsi.sandbox.spring_authn;

import java.util.Map;

import org.ohdsi.sandbox.spring_authn.auth.JwtService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

	private final JwtService jwtSvc;

	public ApiController(JwtService jwtSvc) {
		this.jwtSvc = jwtSvc;
	}

	@GetMapping("/public")
	public String publicEndpoint() {
		return "This is a public endpoint accessible by anyone.";
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/secure")
	public String secureEndpoint(Authentication authentication) {
		return "This endpoint is secured and requires authentication.   Your identity is: " + authentication.getName();
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
		String token = jwtSvc.generateToken(auth.getName());
		return Map.of("token", token);
	}
	
}