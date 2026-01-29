package org.ohdsi.sandbox.auth_windows.db;

import java.io.IOException;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JsonUsernamePasswordAuthenticationFilter extends OncePerRequestFilter {

  private final AuthenticationManager authenticationManager;
  private final ObjectMapper mapper = new ObjectMapper();

  public JsonUsernamePasswordAuthenticationFilter(AuthenticationManager authenticationManager) {
    this.authenticationManager = authenticationManager;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain chain) throws IOException, ServletException {

    UsernamePasswordAuthenticationToken token = extractAuthentication(request);

    Authentication authResult = authenticationManager.authenticate(token);

    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authResult);
    SecurityContextHolder.setContext(context);

    chain.doFilter(request, response);
  }

  private UsernamePasswordAuthenticationToken extractAuthentication(HttpServletRequest request) throws IOException {

    Map<String, String> creds = mapper.readValue(
        request.getInputStream(),
        new TypeReference<Map<String, String>>() {
        });

    String username = creds.get("username");
    String password = creds.get("password");

    if (username == null || password == null) {
      throw new IOException("Missing username or password in request body");
    }

    return new UsernamePasswordAuthenticationToken(username, password);

  }
}
