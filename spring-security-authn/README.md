# Authentication Demo

This sandbox project demonstrates Spring Security authentication with the following dependencies:

- JDK 21
- Spring Boot 3.5
- Spring Security 6.5
- JSON Web Token (JWT)
- Windows Authentication (via Waffle)
- DB Authentication (via Embedded DB with default users populated)
- LDAP (via referencing external provider GLAuth with additional config (see LDAP section))
- OAuth2 (Google/Facebook) (Not Implemented in this Sandbox)
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

The following implmentations are provided:
- Windows: provided via Waffle and only works on Windows
- DB: a JDBC/Database authentication mechanism that depends on an external database to manage credentials, and manage lockout policy.
- LDAP: Will bind to a configured LDAP provider to perform username/password authentication.
- JWT: Will be the 'default' authentication after one of the other authentications succedd and a JWT is minted for general application use.  Also can support API keys.

Sections below will describe in detail each of the implementations.

In addition, although this project focuses on the authentication, there will be an example controller that shows how method-level security (via `@PreAuthorize`) can be applied to methods to do authorization.  But Authorization is beyond the scope of this sandbox.

# Class Organization

Spring Security handles authentication by starting with a SecurityFilterChain that sets up the default filters, and the developer injects custom filters to handle the appropriate authentication type.  So, a typical authentication implementation will have a {AuthType}AuthConfig (that configures a security chain), an Authentication Manager/Provider to perform the authentication, and a Filter (optional) to handle any request/response orchastration.  

Where possible, core Spring Security Framework classes are preferred.

In summary, the implementation of an authentication implementation should consist of a `{AuthType}AuthConfig` file that will set up the `SecurityFilterChain` to the authentication path, and a filter (with zero or more dependent classes) that will handle the actual authentication work.  The filter is injected into the `SecurityFilterChain` via the `{AuthType}AuthConfig` class, or handled by an authentication provider.

## Spring Security SecurityFilterChain Basics

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

Form login is a default browser-style login flow (redirects + HTML forms).  This form is unused in WebAPI, so we will rely on Basic authentication to deliver username/password credentials from client.

For REST APIs, you typically:

- Disable form login and anything session/redirect related.
- Add your own custom authentication filter at a specific URL (like /user/login/db).
- Return JSON tokens or session IDs, not HTML.

For WindowsAuth, many defaults are disabled for example:

```
	@Bean
	@Order(1)
	public SecurityFilterChain windowsAuthChain(HttpSecurity http,
			CorsConfigurationSource corsConfigurationSource) throws Exception {

    // Waffle filters wrap native providers iniside filter providers, and builds a collection.
    WindowsAuthProviderImpl windowsAuthProvider = new WindowsAuthProviderImpl();
    NegotiateSecurityFilterProvider filterProvider = new NegotiateSecurityFilterProvider(windowsAuthProvider);
    SecurityFilterProviderCollection providers = new SecurityFilterProviderCollection(new SecurityFilterProvider[]{filterProvider});

    // the entry ponit filter initiates negotation from a authentication exception, the negotiate filter performs the actual auth.
    NegotiateSecurityFilterEntryPoint entryFilter = new NegotiateSecurityFilterEntryPoint();
    entryFilter.setProvider(providers);
    NegotiateSecurityFilter negotiateFilter = new NegotiateSecurityFilter();
    negotiateFilter.setProvider(providers);

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
						.authenticationEntryPoint(entryFilter))
				.addFilterBefore(negotiateFilter,  AuthorizationFilter.class);

		return http.build();
	}  

```

Some notes:
- The `@Order(1)` on the bean is to control the order of pattern matching being applied in the `SecurityFilterChain`.  The default chain should be `@Order(100)` so that it applies after all other matching URLs, and any authentication `SecurityFilterChain` paths can be set to `@Order(1)`, because all that matters is that they are handled before the general (JWT Authentication) URL match (*).
- REST API types of applications don't have form authentication or logout handling, so in most cases these are disabled.  However, based on the authentication mechanism, you may want different things enabled, so this structure of code enforces which filters should be used for which authentication.

## The SecurityChain (filter) -> App Controller Hand-off

It is important to understand that the filter's `match()` on a path does not automatically expose an endpoint to the API.  This is where the filter -> controller hand-off comes into play.   This boundary exists because authentication concerns should be localized to the handling the request (at the filter) and then after the request is handled (from authentication perspective) the request moves into the application boundary context.  The application context lives within controllers (that invoke services, and do other application-specific logic such as loading mapped roles into the user's context).  Therefore, there is a `LoginController` which encapsulates the differnt authentication endpoints. This is done for 2 reasons: 1) we don't want to pollute the API space with new top-level classes like `WindowsAuthController` and `LdapAuthController` so embedding those classes in a containign class de-clutters the code tree, and 2) Spring conditional instantiating happens at the class-level and you can't conditionally disable REST endpoints at the method level, so this requires class-per-endpoint authentication endpoint. The following class tries to balance both concerns:

```
public class LoginController {

  /**
   * Windows Authentication controller which responds with JWT and login results.
   */
  @RestController
  @ConditionalOnProperty(prefix = "security.auth.windows", name = "enabled", havingValue = "true")
  public static class Windows {
    private final LoginService loginSvc;

    public Windows(LoginService loginSvc) {
      this.loginSvc = loginSvc;
    }

    @GetMapping("/user/login/windows")
    public LoginService.Result login(Authentication authentication) {
      return loginSvc.onSuccess(authentication);
    }
  }

  /**
   * Database Authentication controller which responds with JWT and login results.
   */
  @RestController
  @ConditionalOnProperty(prefix = "security.auth.db", name = "enabled", havingValue = "true")
  public static class Database {
    private final LoginService loginSvc;

    public Database(LoginService loginSvc) {
      this.loginSvc = loginSvc;
    }

    @GetMapping("/user/login/db")
    public LoginService.Result login(Authentication authentication) {
      return loginSvc.onSuccess(authentication);
    }
  }

  /**
   * Database Authentication controller which responds with JWT and login results.
   */
  @RestController
  @ConditionalOnProperty(prefix = "security.auth.ldap", name = "enabled", havingValue = "true")
  public static class Ldap {

    private final LoginService loginSvc;
    private static final Logger log = LoggerFactory.getLogger(Ldap.class);
    
    public Ldap(LoginService loginSvc) {
      this.loginSvc = loginSvc;
    }

    @GetMapping("/user/login/ldap")
    public LoginService.Result login(Authentication authentication) {

      List<String> roles = authentication.getAuthorities().stream()
          .map(GrantedAuthority::getAuthority)
          .toList();

      log.info("User {} has roles {}", authentication.getName(), roles);
      return loginSvc.onSuccess(authentication);
    }
  }

}
```

The `LoginController` wraps individual classes that expose the authentication endpoints, and call out to the `LoginService` to take the necessary actions when a login is completed.   The 'wrapper' class wraps the individual classes for each authentication endpoint so that they can be disabled based on the authentication setting in `applicatin.yaml`.  

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

# Proof-of-Concept Implmentation Details

The following sections describe specific details about the particular authentication implementation in the topic.  To avoid environment pollution with `@Bean` that only have one istance in one context (many authentication filters will be like this), we create local instances of classes to support the authentication method, and inject any bean that might need to be shared across contexts.


## Windows Authentication

This SecurityFilterChain `WindowsAuthConfig` defines a dedicated, minimal Spring Security chain that exists solely to perform Windows Integrated Authentication (SPNEGO / Negotiate) on the /user/login/windows endpoint. The configuration is conditionally enabled via security.auth.windows.enabled, allowing the entire authentication mechanism to be cleanly turned on or off at startup. The chain is ordered with high precedence and scoped using securityMatcher, ensuring it only applies to the Windows login endpoint and does not interfere with the rest of the application’s security configuration.

The chain integrates Waffle’s Negotiate support by wiring a WindowsAuthProviderImpl into a NegotiateSecurityFilterProvider, which is shared by both the entry point and the authentication filter. When an unauthenticated request reaches the endpoint, Spring Security enforces authentication and delegates to the NegotiateSecurityFilterEntryPoint, which issues the WWW-Authenticate: Negotiate challenge to the client. Subsequent requests carrying the Kerberos or NTLM token are processed by the NegotiateSecurityFilter, which performs the actual Windows authentication and establishes a Spring Security Authentication in the SecurityContext. All unrelated security features (sessions, form login, logout, anonymous access, request caching, CSRF) are explicitly disabled to keep the chain focused and deterministic. Once authentication succeeds, request handling continues to a login controller, which is responsible for applying any additional login policy and minting JWTs for normal application access.

The Windows domain groups associated to the authenticated identity are attached to the `Authentication` context from Spring Security, and can be used to associate Windows Domain groups to WebAPI roles.

YAML Configuration:

```
security:
  auth:
    windows:
      enabled: true
```
Curl example to test (note: only works on Windows):

```
curl.exe --negotiate -u :  http://localhost:8080/user/login/windows
```

## Database Authentication

This database authentication implementation defines a self-contained Spring Security authentication flow that validates user credentials against a dedicated authentication database and enforces account enablement, retry limits, and temporary lockouts. The entire configuration is conditionally enabled via security.auth.db.enabled, allowing database authentication to be cleanly toggled without affecting other login mechanisms. The security filter chain is scoped exclusively to the /user/login/db endpoint, ensuring that these rules apply only during the database login process and do not interfere with normal application request handling.

At the core of the design is a custom authentication model built around the DatabaseUser domain object, which represents a user record loaded directly from the auth_user table. This object encapsulates not only credentials and enablement state, but also operational security data such as failed login attempts and lockout expiration timestamps. Rather than relying on Spring Security’s default UserDetails implementation, the system uses a purpose-built DatabaseUserDetailsService backed by JdbcTemplate, giving full control over SQL queries, schema layout, and update semantics. This service is responsible for loading users, incrementing failed attempts, resetting counters on success, and locking accounts when policy thresholds are exceeded.

Authentication itself is performed by a custom AuthenticationProvider, DatabaseAuthenticationProvider, which integrates directly with Spring Security’s authentication pipeline. When a login request is received, Spring’s BasicAuthenticationFilter extracts credentials from the HTTP Authorization header and delegates authentication to a ProviderManager containing this provider. The provider performs a sequence of checks: user existence and enablement, lockout status, and password verification using a configurable PasswordEncoder. Failed authentication attempts are recorded in the database, and once the configured maximum is reached, the account is locked until a calculated future time based on the lockout policy. On successful authentication, failed-attempt counters and lockout state are cleared, and a fully authenticated UsernamePasswordAuthenticationToken is returned with the user’s granted authorities.

The SecurityFilterChain itself is intentionally minimal and deterministic. Session management, CSRF protection, form login, anonymous authentication, logout handling, and request caching are all disabled, as this chain exists solely to authenticate credentials and establish a SecurityContext. CORS support is explicitly configured, and Spring Security’s built-in HTTP Basic authentication mechanism is enabled to handle credential transport and challenge/response semantics. Once authentication completes successfully, control passes to a login controller, which applies any additional login policy and mints JWTs for normal, stateless application access.

For proof-of-concept purposes, a stub authentication data source is provided using an embedded H2 database. This includes schema initialization and sample user insertion at startup, allowing the full authentication flow—including password validation, retries, and lockouts—to be exercised without external dependencies. In a production deployment, this stub configuration would be replaced with a real authentication database, but the surrounding security and authentication architecture would remain unchanged.

The authentication database is initialized at application startup using a simple schema and a small set of seed users. The schema is created by executing a SQL script (auth-schema.sql) via Spring’s ResourceDatabasePopulator, ensuring the required auth_user table exists before authentication begins. Two example users are inserted into the table with enabled accounts and zero failed login attempts:

Username: alice
Password: password1

Username: bob
Password: password2

These accounts provide a predictable baseline for validating database authentication behavior, including credential verification, failed login tracking, and account lockout enforcement.

Passwords in this setup leverage Spring Security’s delegating password encoder infrastructure. Each stored password value is prefixed with an encoding identifier—such as {noop} or {bcrypt}—that indicates which PasswordEncoder implementation should be used during authentication. In this POC, the default users are stored with the {noop} prefix, meaning the passwords are kept in plain text and compared directly at login time. While this simplifies development and testing, it is not appropriate for production use. In a production scenario, passwords would be stored with a {bcrypt} prefix (or another strong hashing algorithm), allowing Spring Security to automatically select the correct encoder and verify credentials without requiring any changes to the authentication logic. This design enables multiple encoding strategies to coexist and supports safe, incremental upgrades of password hashing policies over time.

YAML configuration:
```
security:
  auth:
    db:
      enabled: true
      lockout-policy:
        max-failed-attempts: 5
        lockout-duration: 30m
			# datasource not used in this POC, an embedded stub is created
			datasource:
        driverClassName: org.postgresql.Driver
        password: app1dbsecurity_pass
        url: jdbc:postgresql://localhost:5436/SECURITY_DB
        username: dbsecurity_user			
```

Example curl to test:
```
curl.exe -u alice:password1  http://localhost:8080/user/login/db
```

## LDAP Authentication

This LDAP authentication implementation defines a dedicated Spring Security authentication chain that validates user credentials against an LDAP directory and resolves group memberships into application authorities. The configuration is conditionally enabled via security.auth.ldap.enabled and is scoped exclusively to the /user/login/ldap endpoint, allowing LDAP authentication to coexist cleanly alongside other login mechanisms. For proof-of-concept purposes, the LDAP directory is provided by [GLAuth](https://github.com/glauth/glauth), a lightweight LDAP server that can be easily stood up for development and testing. GLAuth is launched in non-SSL mode using its command-line executable, and a small modification is applied to the default configuration to support group-based authorization.

The GLAuth configuration is adjusted to ensure that LDAP groups can be correctly resolved by Spring Security’s group search logic. In particular, the superhero group is explicitly defined as a groupOfNames object and populated with member DNs referencing user entries (for example, cn=johndoe,ou=superheros,ou=users,dc=glauth,dc=com). This change is critical because Spring Security’s LDAP authorities resolution expects standard group semantics, including an object class that supports membership attributes. Without this modification, group-to-role mapping would not function correctly, even though user authentication itself would succeed.

This is the modified section that is required for this POC:

```
#################
# The groups section contains a hardcoded list of valid users.
[[groups]]
  name = "superheros"
  gidnumber = 5501
  objectclass = ["groupOfNames"]
  members = [
    "cn=johndoe,ou=superheros,ou=users,dc=glauth,dc=com"
  ]
```

The above adds the `objectClass` and `members` elements to the default configuration of the GLAuth quick start.

Within Spring Security, authentication is built around a bind-based LDAP flow. A DefaultSpringSecurityContextSource is configured using the LDAP URL and base DN, with optional service-account binding when anonymous searches are not permitted. If a bind DN is provided, all directory searches are performed using that account; otherwise, anonymous bind is used. A BindAuthenticator is then configured with a filter-based user search, allowing Spring Security to locate the user’s DN dynamically using the configured search base and filter (e.g., (cn={0})) before attempting to bind as the user to verify credentials.

Group membership is resolved using a DefaultLdapAuthoritiesPopulator, which performs a secondary LDAP search to locate groups containing the authenticated user. The group search base, search filter, and role attribute are all externally configurable, allowing the directory layout to vary without code changes. In this POC, group membership is resolved via a uniqueMember filter, and the group’s cn attribute is used as the role name. Retrieved authorities are normalized and mapped to uppercase to align with application role conventions. The resulting LdapAuthenticationProvider is registered with a ProviderManager, which integrates into Spring Security’s authentication infrastructure and publishes authentication events for observability and auditing.

The SecurityFilterChain itself is intentionally minimal and purpose-built. State-related and interactive features such as sessions, CSRF protection, form login, logout, anonymous authentication, and request caching are disabled. HTTP Basic authentication is enabled to handle credential transport and challenge/response semantics, while Spring Security delegates actual credential verification and authority resolution to the LDAP provider. Upon successful authentication, a fully populated Authentication is placed into the SecurityContext, after which control flows to a login controller responsible for applying any additional login policy and minting JWTs for normal application access.

YAML configuration:

```
security:
  auth:
    ldap:
      enabled: true
      base-dn: dc=glauth,dc=com
      # No Spaces in the bind-dn! Careful when doing concatination
      bind-dn: cn=serviceuser,${security.auth.ldap.base-dn}
      bind-password: mysecret
      group-filter: (uniqueMember={0})
      group-role-attr: "cn"
      group-search-base: ou=groups
      url: ldap://localhost:3893
      user-filter: (cn={0})
      user-search-base: ""
```

Users in sample config:
johndoe:dogood

Example curl to test:
```
curl.exe -u johndoe:dogood2  http://localhost:8080/user/login/ldap
```

## WebAPI Session Management

WebAPI uses JWTs (JSON Web Tokens) for authentication. Each token is minted upon successful login and contains an expiration date. The system validates JWTs on each request, but in the current implementation, session state is stored in-memory using a `PassiveExpiringMap`. This approach has several limitations:

- Sessions do not survive application restarts.
- Shared or clustered environments cannot coordinate session state.
- Session management and JWT minting are tightly coupled, mixing authentication concerns with session tracking.

The approach described here decouples JWT handling from session management while storing sessions in a database for persistence and easier maintenance.


#### 1. Session Creation

- When a user logs in, a session is created in the database with a UUID, username, creation timestamp, and expiration timestamp.
- If single-login mode is enabled, any existing sessions for the user are revoked.
- A `cleanupRequired` flag is set to `true` whenever a new session is created to trigger scheduled cleanup later.

```java
public UUID createSession(String username) {
    if (props.isSingleLogin()) {
        repo.revokeByUsername(username);
        log.debug("Revoking sessions for: {}", username);
    }

    UUID sessionId = UUID.randomUUID();
    Instant now = Instant.now();
    Instant expiresAt = now.plus(props.getExpiration());

    UserSession session = new UserSession();
    session.setSessionId(sessionId);
    session.setUsername(username);
    session.setCreatedAt(now);
    session.setExpiresAt(expiresAt);
    session.setRevoked(false);

    repo.save(session);
    this.cleanupRequired = true;
    log.debug("Session: {} created for: {}", sessionId, username);

    return sessionId;
}
```

#### 2. Session Extension

- When a user performs an action or refreshes their JWT, the session expiration can be extended.
- The `cleanupRequired` flag is updated in case the new expiration creates overlapping session expiration windows.

```java
public void extendSession(UUID sessionId, Instant newExpiresAt) {
    repo.findById(sessionId).ifPresent(session -> {
        session.setExpiresAt(newExpiresAt);
        repo.save(session);
        cleanupRequired = true;
    });
    log.debug("Session: {} extended to: {}", sessionId, newExpiresAt);
}
```

#### 3. Session Revocation

- Sessions can be revoked individually or per user.
- Revoked sessions remain in the database but are marked as `revoked`.
- This allows JWT validation to check if a session is still valid without removing historical records.

```java
public void revokeSession(UUID sessionId) {
    repo.revokeBySessionId(sessionId);
    cleanupRequired = true;
    log.debug("Session: {} revoked.", sessionId);
}

public void revokeUserSessions(String username) {
    repo.revokeByUsername(username);
    cleanupRequired = true;
    log.debug("Sessions for user: {} revoked.", username);
}
```

#### 4. Scheduled Cleanup

- Expired sessions are automatically cleaned up by a scheduled task.
- The task runs at a configurable interval, e.g., every hour.
- To avoid unnecessary database hits, a `cleanupRequired` flag is used:
  - When a session is created or extended, the flag is set to `true`.
  - The cleanup task only performs work if `cleanupRequired` is `true`.
  - After cleanup, the task counts remaining expired sessions; if any remain, `cleanupRequired` is reset to `true`.

```java
@Scheduled(fixedRateString = "#{${security.sessions.cleanup-interval}.toMillis()}")
public void cleanupExpiredSessions() {
    if (!cleanupRequired)
        return;

    // Remove expired sessions from the database
    repo.deleteByExpiresAtBefore(Instant.now());

    // Check if more expired sessions exist and set the flag accordingly
    long openSessions = repo.countByExpiresAtAfter(Instant.now());
    cleanupRequired = openSessions > 0;

    log.debug("Cleanup for expired sessions completed. Outstanding sessions: {}", openSessions);
}
```

- **Notes:**
  - The scheduled method lives directly in `UserSessionStore` for simplicity.
  - `@Scheduled` requires `@EnableScheduling` on a configuration class or the main application.
  - Using the flag avoids running unnecessary queries when the system is idle.


#### 5. Database Storage & Repository

- Sessions are persisted in a relational database table with the following columns: `sessionId`, `username`, `createdAt`, `expiresAt`, and `revoked`.
- The repository provides methods for:

  - Validating a session
  - Revoking sessions
  - Counting expired sessions for cleanup
  - Counting active sessions to determine if more cleanup is needed

```java
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    @Query("""
        select count(s) > 0
        from UserSession s
        where s.username = :username
          and s.sessionId = :sessionId
          and s.revoked = false
          and s.expiresAt > :now
    """)
    boolean isSessionValid(String username, UUID sessionId, Instant now);

    @Modifying
    @Query("""
        update UserSession s
        set s.revoked = true
        where s.username = :username
    """)
    void revokeByUsername(String username);

    @Modifying
    @Query("""
        update UserSession s
        set s.revoked = true
        where s.sessionId = :sessionId
    """)
    void revokeBySessionId(UUID sessionId);

    @Modifying
    @Query("""
        delete from UserSession s
        where s.expiresAt < :now
    """)
    void deleteByExpiresAtBefore(Instant now);

    @Query("""
        select count(s)
        from UserSession s
        where s.expiresAt > :now
    """)
    long countByExpiresAtAfter(Instant now);
}
```
