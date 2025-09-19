package org.ohdsi.sandbox.auth_windows;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import waffle.servlet.spi.NegotiateSecurityFilterProvider;
import waffle.servlet.spi.SecurityFilterProvider;
import waffle.servlet.spi.SecurityFilterProviderCollection;
import waffle.spring.NegotiateSecurityFilter;
import waffle.windows.auth.impl.WindowsAuthProviderImpl;

/**
 * This class wraps a Waffle negotiate security filter and will issue the JWT
 * token for the webapp
 */
public class WindowsAuthFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private final NegotiateSecurityFilter negotiateFilter;

  public WindowsAuthFilter(JwtUtil jwtUtil) {
    this.negotiateFilter = new NegotiateSecurityFilter();
    SecurityFilterProvider[] providers = new SecurityFilterProvider[] {
        new NegotiateSecurityFilterProvider(new WindowsAuthProviderImpl()) };
    this.negotiateFilter.setProvider(new SecurityFilterProviderCollection(providers));
    this.jwtUtil = jwtUtil;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain)
      throws ServletException, IOException {

    // if no Authorization header present, then the caller wasn't signaled to send the authorization header
    // and we should send the unautorhised response with the WWW-Authenticate header set to 'Negotiate'.
    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || authHeader.isEmpty()) {
      // Challenge the browser for SPNEGO
      response.setHeader("WWW-Authenticate", "Negotiate");
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return; // do not continue the filter chain
    }

    // Delegate to Waffle's filter
    negotiateFilter.doFilter(request, response, (req, res) -> {});
    
    // After filter completes, check SecurityContext
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated()) {
      String token = jwtUtil.generateToken(auth.getName());
      response.setContentType("application/json");
      response.getWriter().write("{\"token\":\"" + token + "\"}");
      response.getWriter().flush();
    }
  }
}