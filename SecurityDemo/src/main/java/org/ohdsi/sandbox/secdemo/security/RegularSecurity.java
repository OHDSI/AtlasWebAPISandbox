package org.ohdsi.sandbox.secdemo.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@ConditionalOnProperty(name = "webapi.security.provider", havingValue = "RegularSecurity")
public class RegularSecurity {
    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests((requests) -> requests
                .requestMatchers("/cohortdefinition").authenticated()
                .anyRequest().permitAll());
        http.formLogin(withDefaults());
        http.httpBasic(withDefaults());
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // Two users.  Shows password encoder patterns {noop} - no encoding,
        // and {bcrypt} which the current state of the art
        var user = User.withUsername("user").password("{noop}Jumping-Java-00").authorities("read").build();

        // Since this is a demo, password is Super-Duper-85$
        var admin = User.withUsername("admin")
                            .password("{bcrypt}$2a$12$imtbrq3VEa0ZPLAnhpCZHeg4Z8Kjj4Cn9kGhyFRGdesEzQMwvvMwK")
                            .authorities("admin").build();
        return new InMemoryUserDetailsManager(user, admin);
    }

    // The delegating password encoder is new to Spring Security 5.  It uses the prefix to find
    // the appropriate encoder.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
