package org.ohdsi.sandbox.auth_windows;

import waffle.servlet.spi.NegotiateSecurityFilterProvider;
import waffle.servlet.spi.SecurityFilterProvider;
import waffle.spring.NegotiateSecurityFilter;
import waffle.spring.WindowsAuthenticationProvider;
import waffle.windows.auth.IWindowsAuthProvider;
import waffle.windows.auth.impl.WindowsAuthProviderImpl;
import waffle.windows.auth.PrincipalFormat;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public IWindowsAuthProvider waffleAuthProviderImpl() {
        return new WindowsAuthProviderImpl();
    }

    @Bean
    public WindowsAuthenticationProvider windowsAuthenticationProvider(IWindowsAuthProvider impl) {
        WindowsAuthenticationProvider provider = new WindowsAuthenticationProvider();
        provider.setAuthProvider(impl);
        provider.setAllowGuestLogin(false);

        // Disable group lookup
				
        provider.setPrincipalFormatEnum(PrincipalFormat.SID);
        provider.setRoleFormatEnum(PrincipalFormat.NONE);

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http,
            WindowsAuthenticationProvider windowsAuthProvider) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                   .authenticationProvider(windowsAuthProvider)
                   .build();
    }

    @Bean
    public NegotiateSecurityFilter negotiateSecurityFilter(IWindowsAuthProvider impl) {
        NegotiateSecurityFilter filter = new NegotiateSecurityFilter();
        filter.setProvider(new waffle.servlet.spi.SecurityFilterProviderCollection(
                new SecurityFilterProvider[] {new NegotiateSecurityFilterProvider(impl)}
        ));
        return filter;
    }

    // Windows authentication filter chain
    @Bean
    SecurityFilterChain windowsAuthFilterChain(HttpSecurity http, NegotiateSecurityFilter negotiateSecurityFilter) throws Exception {
        http
            .securityMatcher("/windows/**")       // only match Windows auth endpoints
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .addFilterBefore(negotiateSecurityFilter, AnonymousAuthenticationFilter.class)
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .anonymous(an -> an.disable());       // disable anonymous for this chain
        return http.build();
    }

}