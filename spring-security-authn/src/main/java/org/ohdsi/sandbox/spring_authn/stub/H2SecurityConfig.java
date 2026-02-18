package org.ohdsi.sandbox.spring_authn.stub;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
public class H2SecurityConfig {

  @Bean
  @Order(1)
  SecurityFilterChain h2SecurityFilterChain(HttpSecurity http) throws Exception {

    http
        .securityMatcher(new AntPathRequestMatcher("/h2-console/**"))

        .authorizeHttpRequests(auth -> auth
            .anyRequest().permitAll()
        )

        .csrf(csrf -> csrf.disable())

        .headers(headers -> headers
            .frameOptions(frame -> frame.sameOrigin())
        );

    return http.build();
  }
}
