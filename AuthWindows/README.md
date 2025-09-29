# Authentication Demo

This sandbox project demonstrates Spring Security authentication with the following dependencies:

- JDK 21
- Spring Boot 3.5
- Spring Security 6.5
- JSON Web Token (JWT)
- Waffle (for Windows Auth)
- Tomcat Embed 10.1

# Spring Security Concepts

The main abstractions contained in Spring Security can be summarized as:

- **SecurityFilterChain** → request interception pipeline  
- **AuthenticationManager / AuthenticationProvider** → identity verification  
- **SecurityContext** → stores the user identity for the current thread  
- **AccessDecisionManager / Authorization** → rules for access control  
- **UserDetails / UserDetailsService** → model for user accounts  
- **PasswordEncoder** → password safety  

This project focuses on the first 3: SecurityFilterChain, AuthenticationManager/AuthenticationProvider and SecurityContext.

Windows Authentication is provided through Waffle, and this project provides a working implementation (on Windows), while there are place holders for a DB Authentication implementation (not implemented here), and the JWT authentication which follows the model of WebAPI 2.x where JWT tokens are used to identify clients to the server.

In addition, although this project focuses on the authentication, there will be an example controller that shows how method-level security (via `@PreAuthorize`) can be applied to methods to do authorization.  But Authorization is beyond the scope of this sandbox.

# Class Organization

Spring Security handles authentication by starting with a SecurityFilterChain that sets up the default filters, and the developer injects custom filters to handle the appropriate authentication type.  So, a typical authentication implementation will have a {AuthType}SecurityConfig (that configures a security chain) and an authentication filter to handle the authentication.  Other classes could be added as needed (such as JwtAuthenticationToken and JwtAuthenticationProvider).

Using Windows Authentication as an example:
- WindowsAuthSecurityConfig → Defines the path to windows authentication, disables unnecessary default filters from Spring Security and injects the WindowsAuthFilter early in the chain.
- WindowsAuthFilter → Wraps Waffle's NegotiateSecurityFilter (with a WindowsAuthProviderImpl to do the low-level work), and mints a JWT token for the client to use to identify themselves in other endpoints

In summary, the implementation of an authentication implementation should consist of a `{AuthType}Config` file that will set up the `SecurityFilterChain` to the authentication path, and a filter (with zero or more dependent classes) that will handle the actual authentication work.  The filter is injected into the `SecurityFilterChain` via the `{AuthType}Config` class.

# Spring Security SecurityFilterChain Basics

When you declare a **SecurityFilterChain** without disabling defaults, Spring wires in a long list of filters.  
Some of the important ones (in rough order):

- **WebAsyncManagerIntegrationFilter** → integrates security context with async request handling.  
- **SecurityContextPersistenceFilter** → loads/saves SecurityContext for each request (from session by default).  
- **HeaderWriterFilter** → applies security headers (X-Frame-Options, HSTS, etc.).  
- **CsrfFilter** → checks CSRF tokens (enabled by default for state-changing requests).  
- **LogoutFilter** → handles logout URL (e.g. `/logout`).  
- **UsernamePasswordAuthenticationFilter** → looks for username/password form login requests (default login page, `application/x-www-form-urlencoded`).  
- **DefaultLoginPageGeneratingFilter** → renders a simple HTML login form if you didn’t define one.  
- **DefaultLogoutPageGeneratingFilter** → renders a simple logout confirmation page.  
- **BasicAuthenticationFilter** → checks for HTTP Basic auth headers.  
- **BearerTokenAuthenticationFilter** → checks for `Authorization: Bearer` tokens (if enabled).  
- **RequestCacheAwareFilter** → remembers original request for redirect after login.  
- **SecurityContextHolderAwareRequestFilter** → wraps `HttpServletRequest` with methods like `isUserInRole()`.  
- **AnonymousAuthenticationFilter** → supplies an “anonymous” authentication if nobody is logged in.  
- **SessionManagementFilter** → handles session concurrency, fixation, etc.  
- **ExceptionTranslationFilter** → catches security exceptions and translates them to responses (redirects or 403).  
- **FilterSecurityInterceptor** → final check: enforces access rules.  

👉 The exact set changes depending on which DSL calls you make (`formLogin()`, `httpBasic()`, `oauth2Login()`, etc.).

The built-in filters cover a lot (CSRF, headers, login/logout, session, tokens, etc.).

Form login is a default browser-style login flow (redirects + HTML forms).

For REST APIs, you typically:

- Disable form login and anything session/redirect related.
- Add your own custom authentication filter at a specific URL (like /user/login/db).
- Return JSON tokens or session IDs, not HTML.

For WindowsAuth, many defaults are disabled for example:

```
	@Bean
	@Order(1)
	public SecurityFilterChain windowsAuthChain(HttpSecurity http, JwtUtil jwtUtil,
			CorsConfigurationSource corsConfigurationSource) throws Exception {

		http
				.securityMatcher("/user/login/windows")
				.csrf(AbstractHttpConfigurer::disable)
				.cors(cors -> cors.configurationSource(corsConfigurationSource))
				// Disable all unnecessary filters
				.requestCache(AbstractHttpConfigurer::disable)
				.sessionManagement(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.anonymous(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.authorizeHttpRequests(authz -> authz.anyRequest().permitAll())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(
								(req, res, excep) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)
						)
				)
				.addFilterAfter(windowsAuthFilter(jwtUtil), CorsFilter.class);

		return http.build();
	}

	private WindowsAuthFilter windowsAuthFilter(JwtUtil jwtUtil) {
		WindowsAuthFilter filter = new WindowsAuthFilter(jwtUtil);
		return filter;
	}

```

Some notes:
- The `@Order(1)` on the bean is to control the order of pattern matching being applied in the `SecurityFilterChain`.  The default chain should be `@Order(100)` so that it applies after all other matching URLs, and any authentication `SecurityFilterChain` paths can be set to `@Order(1)`, because all that matters is that they are handled before the general (JWT Authentication) URL match (*).
- REST API types of applications don't have form authentication or logout handling, so in most cases these are disabled.  However, based on the authentication mechanism, you may want different things enabled, so this structure of code enforces which filters should be used for which authentication.


# Login/Logout Semantics

## Atlas 2.x

In Atlas 2.x, when a user logs in, they are granted a JWT token that expires based on a timeout (configurable), and the client invokes a `refresh` endpoint in order to extend a user's login session (before the JWT token expires).  On its own, this would prevent the need for state on the server because the JWT token self-validates based on a signature and therefore isn't stored anywhere (either in WebAPI memory or in the database): nothing needs to be looked up and matched with server state compared to what the client presents in the Bearer token.  

This works better in load-balanced settings where it doesn't matter which server you are connecting to, the token can be validated in a clustered context (as opposed to 'sticky servers').  No session state or client cookies are needed.  

However, there is an additional functional requirement:  a user can only log in once.   This means that the server needs to maintain state about a users's 'active' token, such that if a user submits a valid JWT token, it's only accepted if it is recorded as the user's 'current' token.  Because this, much of the advantage of self-contained JWT tokens is lost.  If the user logs into a specific node on the load-balanced cluster, the client will need to 'stick' there because each node in the cluster only knows about the sessions they have created (unless you use a shared-state service or shared database, which as a performance penalty).  

Even without this functional requirement (which would incur a state property), if we want to support a SSO signout or credential revocation from a central source, the WebAPI service would need to continue maintaining the state of JWTs that they minted for the client (ie: in order to revoke tokens for a client, you need to know what they are).

### Recommended JWT Architecture (Industry Standard based on ChatGPT)

On login, the server issues **two tokens**:

#### Access token (JWT)
- Short lifetime (e.g. 5–15 minutes).  
- Sent with every request in `Authorization: Bearer <access_token>`.  

#### Refresh token
- Longer lifetime (e.g. days/weeks).  
- Stored securely (often in **HTTP-only cookie**).  
- Used only to request a new access token.  

The client holds onto the refresh token, and when the access token expires, they call an endpoint like `/auth/refresh` with the refresh token.  

✅ **Standard pattern** (used by OAuth2, OpenID Connect, etc.).

---

### 🧾 Why two tokens?

- **Access token** = fast, stateless, secure by being short-lived.  
- **Refresh token** = allows long-lived sessions without forcing re-login every 10 minutes.  
- If an access token leaks → the damage window is short.  
- If a refresh token leaks → you can revoke it on the server (blacklist/DB check).  

---

### 🔑 Best practice today

When someone logs in:
- You mint both:  
  - **Access token** (JWT, short TTL, stateless).  
  - **Refresh token** (long TTL, stored server-side in DB/Redis with user ID & status).  

Logout means:
- Delete the **refresh token** (from DB or memory).  
- Access token naturally expires soon.  

## Atlas 3.x

Migrating to a two-token architecture will be a significant change in behavior from the UI (Atlas) perspective:   separate tokens will need to be saved in order to perform the refresh task vs. the access task.  This sandbox project demonstrates endpoints that can extend the life of the user's JWT (which serves as an 'access token'), but there are pros and cons by maintaining the current 2.x architecture:

### 🔁 How “refreshing with the same token” would work

1. Client calls `/auth/refresh` with the current **access token**.  
2. Server validates it, checks expiry isn’t passed yet.  
3. Server issues a new token with a new `exp`.  
4. If the client fails to refresh before expiry, they must re-authenticate.  

---

### ⚖️ Pros

- **Simplicity**: Only one kind of token to manage.  
- **No DB/cache**: You don’t need to store refresh tokens server-side.  
- **Sliding sessions**: Active users can keep extending their session, idle ones time out.  

---

### 🚨 Cons (and why industry prefers separate refresh tokens)

#### Replay risk
- If an attacker steals the access token, they can keep refreshing it forever → unlimited lifetime.  
- With a refresh token model, stolen access tokens expire quickly, limiting damage.  

#### Breaks statelessness
- To safely implement sliding expiration, you often need to keep **server-side state** (e.g., a “last refresh time” per user or token ID) to prevent abuse.  
- Otherwise, the client could keep re-using the same original token indefinitely, which isn’t safe.  

#### Token bloat
- JWTs are meant to be “issue once, verify many times.”  
- Continuously re-minting them makes them behave more like **opaque session cookies**.  

#### Harder revocation
- Without a separate refresh token store, you have no easy hook to revoke tokens (e.g., on logout, password change, admin action).  
- You’d need **blacklisting logic** anyway → which brings back server-side state.  

---

### 🏆 Why best practice is two tokens

- **Access tokens**: short-lived, stateless, easy to validate.  
- **Refresh tokens**: long-lived, but server-managed, so you can revoke them.  
- **Security model**:  
  - If access token is stolen → attacker only has a 10–15 min window.  
  - If refresh token is stolen → you can revoke it centrally.  

