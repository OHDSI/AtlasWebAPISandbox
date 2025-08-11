package org.ohdsi.sandbox.secdemo.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Primary
@ConditionalOnProperty(name = "webapi.security.provider", havingValue = "DegradedSecurity")
public class DegradedSecurity {
    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests((requests) -> requests
                .requestMatchers("/userpermissions/**").denyAll()
                .anyRequest().anonymous());
        return http.build();
    }
}
