package org.ohdsi.sandbox.auth_windows;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import waffle.servlet.spi.NegotiateSecurityFilterProvider;
import waffle.servlet.spi.SecurityFilterProvider;
import waffle.servlet.spi.SecurityFilterProviderCollection;
import waffle.spring.NegotiateSecurityFilter;
import waffle.spring.NegotiateSecurityFilterEntryPoint;
import waffle.windows.auth.impl.WindowsAuthProviderImpl;

@Configuration
@ConditionalOnProperty(prefix = "security.auth.windows", name = "enabled", havingValue = "true")
public class WindowsAuthConfig {

  @Bean
  public WindowsAuthProviderImpl waffleWindowsAuthProvider() {
    return new WindowsAuthProviderImpl();
  }

  @Bean
  public NegotiateSecurityFilterProvider negotiateSecurityFilterProvider(
      WindowsAuthProviderImpl windowsAuthProvider) {
    return new NegotiateSecurityFilterProvider(windowsAuthProvider);
  }

  @Bean
  public SecurityFilterProviderCollection waffleSecurityFilterProviderCollection(
      NegotiateSecurityFilterProvider negotiateSecurityFilterProvider) {
    SecurityFilterProvider[] securityFilterProviders = {
        negotiateSecurityFilterProvider
    };
    return new SecurityFilterProviderCollection(securityFilterProviders);
  }

  @Bean
  public NegotiateSecurityFilterEntryPoint negotiateSecurityFilterEntryPoint(
      SecurityFilterProviderCollection securityFilterProviderCollection) {
    NegotiateSecurityFilterEntryPoint negotiateSecurityFilterEntryPoint = new NegotiateSecurityFilterEntryPoint();
    negotiateSecurityFilterEntryPoint.setProvider(securityFilterProviderCollection);
    return negotiateSecurityFilterEntryPoint;
  }

  @Bean
  public NegotiateSecurityFilter waffleNegotiateSecurityFilter(
      SecurityFilterProviderCollection securityFilterProviderCollection) {
    NegotiateSecurityFilter negotiateSecurityFilter = new NegotiateSecurityFilter();
    negotiateSecurityFilter.setProvider(securityFilterProviderCollection);
    return negotiateSecurityFilter;
  }

  // This is required for Spring Boot so it does not register the same filter
  // twice
  @Bean
  public FilterRegistrationBean<NegotiateSecurityFilter> waffleNegotiateSecurityFilterRegistration(
      NegotiateSecurityFilter waffleNegotiateSecurityFilter) {
    FilterRegistrationBean<NegotiateSecurityFilter> registrationBean = new FilterRegistrationBean<>();
    registrationBean.setFilter(waffleNegotiateSecurityFilter);
    registrationBean.setEnabled(false);
    return registrationBean;
  }

	@Bean
	@Order(1)
	public SecurityFilterChain windowsAuthChain(HttpSecurity http,
			NegotiateSecurityFilter negotiateSecurityFilter,
			NegotiateSecurityFilterEntryPoint entryPoint,
			CorsConfigurationSource corsConfigurationSource) throws Exception {

		http
				.securityMatcher("/user/login/windows")
				.csrf(AbstractHttpConfigurer::disable)
				.cors(cors -> cors.configurationSource(corsConfigurationSource))
				// Disable all unecessary filters
				.requestCache(AbstractHttpConfigurer::disable)
				.sessionManagement(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.anonymous(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				// ⬇️ REQUIRE authentication
				.authorizeHttpRequests(authz -> authz.anyRequest().authenticated())
				// ⬇️ This is what triggers the Negotiate challenge
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(entryPoint))
				.addFilterBefore(negotiateSecurityFilter,  AuthorizationFilter.class);

		return http.build();
	}  

}