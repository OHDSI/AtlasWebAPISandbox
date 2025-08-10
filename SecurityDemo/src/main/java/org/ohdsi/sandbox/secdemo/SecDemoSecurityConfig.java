package org.ohdsi.sandbox.secdemo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.password.CompromisedPasswordChecker;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.password.HaveIBeenPwnedRestApiPasswordChecker;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecDemoSecurityConfig {
    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests((requests) -> requests
                .requestMatchers("/cohortdefinition").authenticated()
                );
        http.formLogin(withDefaults());
        http.httpBasic(withDefaults());
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // Two users.  Shows password encoder patterns {noop} - no encoding,
        // and {bcrypt} which the current state of the art
        var user = User.withUsername("app1").password("{noop}ohdsi").authorities("read").build();

        // Since this is a demo, password is Super-Duper-85$
        var admin = User.withUsername("admin")
                            .password("{bcrypt}$2a$12$imtbrq3VEa0ZPLAnhpCZHeg4Z8Kjj4Cn9kGhyFRGdesEzQMwvvMwK")
                            .authorities("admin").build();
        return new InMemoryUserDetailsManager(user, admin);
    }

    // The delegating password encoder is new to Spring 5.  It uses the prefix to find
    // the appropriate encoder.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    // From Spring Security 6.3 version.  Probably not for production,
    // but interesting that we could add a notice to the user that their
    // password is not so good.  Would also only interoperate with in memory
    // and auth db situations, with OAUTH we're out of the loop.
    @Bean
    public CompromisedPasswordChecker compromisedPasswordChecker() {
        return new HaveIBeenPwnedRestApiPasswordChecker();
    }
}
