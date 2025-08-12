package org.ohdsi.sandbox.secdemo.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Primary
@ConditionalOnProperty(name = "webapi.security.mode", havingValue = "anonymous-user")
public class AnonymousUserSecurityMode {
    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .anonymous(a -> a.principal("bob").authorities("xyzzy"))
                .authorizeHttpRequests((requests) -> requests
                .requestMatchers("/permissions/**").denyAll()
                .anyRequest().anonymous());
        return http.build();
    }
}
