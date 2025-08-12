package org.ohdsi.sandbox.secdemo.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@ConditionalOnProperty(name = "webapi.security.mode", havingValue = "regular")
@EnableMethodSecurity
public class RegularSecurityMode {
    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests((requests) -> requests
                .requestMatchers("/cohortdefinition/with_no_authorities")
                    .authenticated()
                .requestMatchers("/cohortdefinition/require_cohortreader_authority_via_code")
                    .hasAuthority("cohort_reader")
                .requestMatchers("/cohortdefinition/require_cohort_reader_authority_via_annotation")
                    .authenticated()
                .requestMatchers("/permissions/**")
                    .authenticated()
                .anyRequest()
                    .permitAll());
        http.formLogin(withDefaults());
        http.httpBasic(withDefaults());
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // Two users.  Shows password encoder patterns {noop} - no encoding,
        // and {bcrypt} which the current state of the art
        var user = User
                .withUsername("app")
                .password("{noop}Jumping-Java-00")
                .authorities("cohort_reader")
                .build();

        // Since this is a demo, password is Super-Duper-85$
        var admin = User
                .withUsername("admin")
                .password("{bcrypt}$2a$12$imtbrq3VEa0ZPLAnhpCZHeg4Z8Kjj4Cn9kGhyFRGdesEzQMwvvMwK")
                .authorities("admin", "cohort_reader", "permission_creator", "permission_reader")
                .build();
        return new InMemoryUserDetailsManager(user, admin);
    }

    // The delegating password encoder is new to Spring Security 5.  It uses the prefix to find
    // the appropriate encoder.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
