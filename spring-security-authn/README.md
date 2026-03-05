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

# Spring Security Authentication

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

### POC token strategy and migration plan

This sandbox demonstrates a single-token flow for simplicity: the JWT issued at login contains a `sid` claim that maps to a server-side `sec_user_session` row. For short-term testing and to keep the demo compact we mint a single JWT per login and validate it against the session store on each request.

For production, prefer the two-token pattern described above: short-lived access tokens (JWT) and long-lived refresh tokens stored/validated server-side. A migration path is:
- Start with short-lived access tokens + server-side session records (what this POC shows).
- Introduce refresh tokens stored in a secure DB or token store and use them to mint new short-lived access tokens.
- Move signing key material into a secrets manager / KMS and adopt asymmetric signing (RS256) with a published JWKs endpoint for cross-instance validation.

# JWT Authentication

It is intended that this POC demonstrates the same flow that will be used in Altlas 3.x for minting JWTs.  After a user logs in through one of the provided authentication providers, they will get a newly minted JWT that is returned in the response, which will be used in the Authorization: header as Bearer <token>.

Some of the JWT safeguards are described and demonstated in this POC, including storage of secrets, and utilizing private/pubic key-pairs to mint JWTs.

## Configuration and RS256 demo notes

Configuration (application.yaml):

```
security:
  jwt:
    # Algorithm: HS256 (symmetric) or RS256 (asymmetric). Default: HS256
    algorithm: HS256
    # HS256 secret (for development only). In production, inject via env or secrets manager.
    secret: super-secret-key-super-secret-key
    # RS256 key paths (PEM files). Leave empty when using HS256.
    rsa:
      private-key-path: ""
      public-key-path: ""
    # Optional key id to include in JWT header when using RS256
    kid: ""
```

### How RS256 keys are loaded (demo)

- This POC supports `RS256` when `security.jwt.algorithm` is set to `RS256` and
  the PEM paths are provided. At startup the application reads the private key
  PEM (`security.jwt.rsa.private-key-path`) as a PKCS#8 private key and the
  public key PEM (`security.jwt.rsa.public-key-path`) as an X.509 public key.
  The encoder publishes a small JWK containing the public key (and optional
  `kid`) so other services can validate tokens.

Quick way to generate a keypair for local testing (OpenSSL):

```bash
# generate a 2048-bit RSA private key (PKCS#8)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt_private.pem

# extract the public key (X.509 PEM)
openssl rsa -pubout -in jwt_private.pem -out jwt_public.pem
```

- Set `security.jwt.rsa.private-key-path` to the path of `jwt_private.pem` and
  `security.jwt.rsa.public-key-path` to `jwt_public.pem`, then set
  `security.jwt.algorithm: RS256` to enable RS256 for signing.

Notes:
- For local development the HS256 secret remains the simplest option, but do
  not commit production secrets into the repo — use environment variables or
  a secrets manager. For production, prefer RS256 with private keys stored in
  a secure KMS and public keys published via a JWKs endpoint to allow safe
  cross-instance validation and key rotation.

### Kid (Key ID) explanation

When using asymmetric keys (RS256) tokens often include a `kid` (key id) in
the JWT header. The `kid` is an opaque identifier that tells token validators
which public key to use for signature verification. In this POC:

- If `security.jwt.kid` is set, the encoder will place that value into the
  token `kid` header. This makes tokens self-describing about which signing
  key was used.
- The simple `jwtDecoderRs` bean in this demo validates tokens using the
  single configured public key (`security.jwt.rsa.public-key-path`). That
  means the `kid` is recorded on the token but the decoder here does not
  dynamically select keys by `kid` — it just verifies against the configured
  public key.

For production you should publish a JWKs endpoint (a JSON Web Key Set) and
configure resource servers (or `NimbusJwtDecoder`) to fetch the JWKs. With a
JWKs-backed decoder the `kid` in the token header is used to select the
matching public key from the JWKs set, which enables safe key rotation and
multiple active keys. Example flow:

- Auth service signs tokens with the private key and includes `kid` in the
  header.
- Auth service publishes a JWKs endpoint (e.g. `https://auth.example.com/.well-known/jwks.json`) containing public keys mapped to `kid` values.
- Resource servers configure a JWKs-aware `JwtDecoder` that fetches the set
  and resolves the correct public key by `kid` when verifying tokens.

Application YAML example (kid shown):

```
security:
  jwt:
    algorithm: RS256
    rsa:
      private-key-path: /run/secrets/jwt_private.pem
      public-key-path: /run/secrets/jwt_public.pem
    kid: demo-key-1
```

To enable a JWKs-backed decoder (recommended for production):

- **Set a JWKs URI:** Configure `security.jwt.jwk-set-uri` to point to your
  authentication server's JWKs endpoint (for example,
  `https://auth.example.com/.well-known/jwks.json`). The runtime will use a
  `NimbusJwtDecoder` that fetches the JWK Set and resolves public keys by
  `kid` automatically.
- **Fallback vs. primary key:** You can keep `security.jwt.rsa.public-key-path`
  as a local fallback during dev, but in production prefer the JWKs URI so key
  rotation works across instances.
- **Cache/refresh settings:** Tune the JWKs caching/refresh behavior in the
  decoder (or via your HTTP cache headers) to balance rotation latency and
  request performance.
- **Token header:** Ensure the issuer sets a `kid` header on tokens to allow
  the decoder to select the correct key from the JWK Set.

Example (production-ready) decoder snippet (tunables shown):

```java
// connectTimeoutMs, readTimeoutMs, sizeLimit
ResourceRetriever resourceRetriever = new DefaultResourceRetriever(2000, 2000, 1024 * 1024);
RemoteJWKSet<SecurityContext> remoteJWKSet = new RemoteJWKSet<>(new URL("https://auth.example.com/.well-known/jwks.json"), resourceRetriever);

ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, remoteJWKSet);
jwtProcessor.setJWSKeySelector(keySelector);

// Spring's NimbusJwtDecoder wraps the configured Nimbus processor
JwtDecoder decoder = new NimbusJwtDecoder(jwtProcessor);
```

YAML example (add to `application.yaml`):

```yaml
security:
  jwt:
    jwk-set-uri: https://auth.example.com/.well-known/jwks.json
```

Decoder selection notes:

- **Selection order:** When the application starts the active `JwtDecoder` is chosen as follows:
  1. If `security.jwt.algorithm=RS256` and `security.jwt.jwk-set-uri` is set → the JWKs-backed decoder is used (preferred).
  2. Else if `security.jwt.algorithm=RS256` and a local `security.jwt.rsa.public-key-path` is configured → the local RS256 public-key decoder is used.
  3. Else (default) → the HS256 symmetric-secret decoder is used.
- **Avoiding ambiguity:** The configuration is written so the JWKs-backed decoder is preferred when present; you should avoid configuring contradictory options in production (e.g., both `jwk-set-uri` and a local public key) unless you understand the precedence.

# WebAPI Security Package Structure & Dependency Guide

This section defines the **intentional package structure** for the
`org.ohdsi.webapi.security` subsystem and the **dependency rules** that govern
how those packages interact.

The goal of this structure is to ensure that the *package tree itself documents
the security architecture* of WebAPI, making it possible to understand what the
system does by reading the folder structure — without needing to know which
classes are DTOs, repositories, or converters.

This structure reflects the decision that **users, roles, and permissions are
all part of a single authorization bounded context**, while authentication,
identity resolution, and framework integration remain separate concerns.

This structure is designed to support the ongoing migration from Shiro to Spring
Security while keeping the security model coherent, testable, and evolvable.

---

## 1. Package Overview

The security subsystem is organized around **capabilities**, not technical
layers.

```
org.ohdsi.webapi.security
 ├─ authc
 ├─ authz
 ├─ identity
 ├─ session
 ├─ provisioning
 └─ spring
```

Each package represents a distinct responsibility within the WebAPI security
model.

---

## 2. Package Responsibilities

### `security` (root)

**Purpose**  
Defines the boundary of the security subsystem.

**Responsibilities**
- High-level security configuration aggregation
- Cross-cutting security constants
- Base security exceptions
- Security-related documentation

**Must not**
- Implement authentication mechanisms
- Make authorization decisions
- Contain persistence logic

This package acts as the *index and entry point* for security.

---

### `security.authc` — Authentication

**Purpose**  
Establish identity for a request.

**Responsibilities**
- Login endpoints
- Credential validation
- JWT, database, or LDAP authentication mechanisms
- Authentication-specific configuration
- Initial identity establishment

**Depends on**
- `security.identity`
- `security.session`
- `security.spring`

**Must not**
- Evaluate permissions
- Perform authorization decisions
- Contain role or permission logic

Subpackages such as `authc.db`, `authc.jwt`, or `authc.ldap` are encouraged when
authentication mechanisms have distinct behavior.

---

### `security.identity` — Request Identity Resolution

**Purpose**  
Guarantee that every request resolves to a WebAPI user identity.

**Responsibilities**
- Mapping Spring Security context to a WebAPI user key
- Anonymous identity resolution
- Identity invariants (e.g., username uniqueness, sentinel user identities)
- Bridging authentication/session context to authorization identity

**Depends on**
- `security.authz`
- `security.session` (if session-backed identity is used)

**Must not**
- Define permissions or roles
- Make authorization decisions
- Implement authentication mechanisms

This package should remain small and focused.

---

### `security.session` — Session Management

**Purpose**  
Maintain continuity of identity across requests.

**Responsibilities**
- Session creation and lookup
- Session persistence
- Session lifecycle management
- Session-to-identity association
- Anonymous session handling

**Depends on**
- `security.identity`
- `security.authz`

**Must not**
- Authenticate credentials
- Evaluate permissions
- Implement authorization logic

The existence of this package explicitly documents that WebAPI has a durable
concept of a session.

---

### `security.authz` — Authorization (Users, Roles, Permissions)

**Purpose**  
Define and enforce **who may do what** in WebAPI.

This package is the **authorization bounded context** and owns *all* concepts
related to authorization: users, roles, permissions, and the relationships
between them.

**Responsibilities**
- User entities and persistence (as security actors)
- Role entities and persistence
- Permission entities and representation
- User–role and role–permission associations
- Creation and management of system roles and user-defined roles
- Creation and assignment of a user’s *personal role*
- Permission wildcard parsing and implication logic
- Resolution of a user’s effective permission set
- Authorization policy orchestration
- Caching and invalidation of authorization state
- Public authorization façade (e.g., `AuthorizationService`)

**Internal Structure**
- Most services and entities are **package-private**
- Only the authorization façade and DTOs are public
- Package-private services collaborate freely within `authz`

**Depends on**
- Nothing within `security` (core domain)
- Optionally `security.session` if authorization is session-scoped

**Must not**
- Authenticate credentials
- Depend on Spring Security APIs directly
- Contain framework-specific wiring

This package defines **what authorization means** in WebAPI and is the single
source of truth for authorization behavior.

---

### `security.provisioning` — External User & Role Population

**Purpose**  
Populate and synchronize WebAPI authorization data from external systems.

**Responsibilities**
- LDAP user and group imports
- Group-to-role mapping logic
- User pre-creation and synchronization
- External role and permission seeding

**Depends on**
- `security.authz`

**Must not**
- Authenticate users
- Participate in request-time authorization decisions

This package operates outside the request/authorization path.

---

### `security.spring` — Spring Security Integration

**Purpose**  
Adapt WebAPI security concepts to Spring Security.

**Responsibilities**
- Spring `AuthenticationConverter` implementations
- `GrantedAuthority` adapters
- Spring-specific authorization evaluators
- `SecurityFilterChain` wiring helpers
- Bridging Spring Security to `authc`, `identity`, and `authz`

**Depends on**
- `security.authc`
- `security.identity`
- `security.authz`
- `security.session`

**Must not**
- Contain business rules
- Define authorization semantics
- Define user, role, or permission behavior

This package exists *because* Spring Security exists; no other package should
depend on it.

---

## 3. Dependency Rules

The following dependency rules define the **allowed direction of coupling**
between security packages.

### Core Dependency Flow

```
authz  ←  identity  ←  authc
  ↑          ↑
  └── session ┘
```

```
authz  ←  provisioning
```

```
spring → authc / identity / authz / session
```

---

### Allowed Dependencies

- `authz` depends on nothing within `security`
- `identity` may depend on `authz`
- `session` may depend on `identity` and `authz`
- `authc` may depend on `identity` and `session`
- `provisioning` may depend on `authz`
- `spring` may depend on all other security packages

---

### Forbidden Dependencies

- `authz` → `authc`
- `authz` → `spring`
- `identity` → `authc`
- `authc` → `authz`
- Any non-`spring` package → `spring`

These rules ensure that:
- Authorization remains a pure, framework-agnostic domain
- Authentication does not leak into authorization modeling
- Identity resolution remains a narrow translation layer
- Framework-specific code is fully isolated

---

## 4. Usage Guidance

This structure is intended to be created **up front**, even if some packages
initially remain empty.

During migration from Shiro to Spring Security:

1. Classify existing classes by *capability*
2. Place them into the appropriate package
3. Preserve behavior while restructuring
4. Refactor logic only after boundaries are stable

Only the public authorization façade (e.g., `AuthorizationService`) should be
used by controllers and external callers.

All other classes inside `security.authz` are internal implementation details
and may change without notice.

Following this guide ensures that the WebAPI security system remains
understandable, extensible, and internally consistent over time.


This section defines the **intentional package structure** for the `org.ohdsi.webapi.security` subsystem and the **dependency rules** that govern how those packages interact.

The goal of this structure is to ensure that the *package tree itself documents the security architecture* of WebAPI, making it possible to understand what the system does by reading the folder structure — without needing to know which classes are DTOs, repositories, or converters.

This structure is designed to support the ongoing migration from Shiro to Spring Security while keeping the security model coherent, testable, and evolvable.

---

# Authorization & Domain Boundary Decisions (WebAPI 3.x) (Aka:  Controller-Service-Repository Structure)

## Context

WebAPI 2.x evolved organically and blended HTTP concerns, persistence entities,
authorization logic, and workflow orchestration within the same classes.
This made the system difficult to reason about during modernization
(Spring Boot 3.x, Spring Security, JDK 21).


While this topic deserves its own Sandbox Project to demonstrate the separation of layers (controller/service/repository), it was necessary
to introduce the concept in this Sandbox Project so it would be applied to the security migration work.

This document captures decisions made to clarify boundaries and guide refactoring.

---

## Decision 1: JPA Entities Are Persistence-Only

**JPA entities (`UserEntity`, `RoleEntity`, `PermissionEntity`, etc.) are treated as
internal implementation details of domain services.**

They must:
- Never be returned from services
- Never be stored in the security context
- Never be used by controllers
- Never leak outside the domain package

Repositories may only be accessed by the owning domain service.

**Rationale**
- Prevents transaction and session leakage
- Avoids lazy-loading bugs
- Decouples authorization from persistence structure
- Enables safe caching and security evaluation

---

## Decision 2: Domain Services Own Business Logic

Classes such as `PermissionManager` are considered **domain services**, even if
their names predate this decision.

Domain services:
- Coordinate repositories
- Enforce business rules
- Publish domain events
- Define transaction boundaries

They do **not** expose entities.

---

## Decision 3: Explicit Mapping, No Global ConversionService

Entity-to-domain and entity-to-value-object mappings are explicit and local.

Allowed patterns:
- Static factory methods on domain models
- Package-private mapper classes

Spring’s `ConversionService` is **not** used for domain boundaries.

**Rationale**
- Keeps mappings discoverable
- Avoids hidden magic
- Improves IDE navigation and refactoring safety

---

## Decision 4: Authorization Results Are Value Objects

Authorization data is materialized as **pure value objects**, not domain models.

Current representation:
```java
Set<String> permissions
```

This represents computed authorization facts only.

Identity information (username, userId) lives exclusively in:
- `Principal`
- `Authentication`

**Rationale**
- Aligns with Spring Security’s model
- Prevents duplication of identity data
- Keeps authorization deterministic and serializable

---

## Decision 5: Optional AuthorizationInfo Wrapper

If additional authorization metadata is required in the future (e.g. origin,
approval state, computation timestamp), it may be introduced as a value object:

```java
AuthorizationInfo {
  Set<String> permissions;
  ...
}
```

This object must **not** include identity fields such as username or userId.

---

## Decision 6: Controllers vs Services

Controllers:
- Handle HTTP concerns only
- Do not contain business logic
- Do not access repositories
- Do not work with entities

Services:
- Contain workflow and domain logic
- Define transactional boundaries
- Return domain models or value objects

This separation is enforced incrementally during refactoring.

---


# Authentication Implmentation Details

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

### Seed users (authentication DB stub)

The embedded authentication stub seeds a few example users for testing. Use these credentials with the database login endpoint (e.g. `/user/login/db`).

| Username | Password  | Notes |
|---|---|---|
| alice | password1 | no default permissions — useful for testing user registration |
| bob | password2 | owns a cohort (has entity-level access) |
| joe | password2 | granted write-access to bob's cohort |
| writeuser | password1 | global write permission (used for testing write-level access) |


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

## Session lifecycle (login → activity → logout)

- Login: user authenticates (DB/LDAP/Windows) and `LoginService.onSuccess()` is called.
  - A `sec_user_session` row is created via `UserSessionStore.createSession()` with `sessionId`, `username`, `createdAt`, `expiresAt`, and `revoked=false`.
  - A JWT is minted by `JwtService.generateToken(...)` and contains a `sid` claim referencing the `sessionId`.

- Activity / Request validation:
  - The resource filter chain decodes the JWT and `JwtToWebApiAuthenticationConverter` validates the session by calling `UserSessionStore.isSessionValid(username, sessionId)`.
  - If the session is missing, expired, or revoked, authentication fails and the request is rejected.

- Logout / Revocation:
  - Clients should call `POST /user/logout` (added in this demo) with their Bearer JWT.
  - The controller delegates to `LoginService.logout(...)` which revokes the session in the DB (`UserSessionStore.revokeSession(sessionId)`), making any outstanding JWTs invalid.

- Cleanup:
  - A scheduled task (`LoginService.cleanupSessions`) runs at `sessionProperties.cleanupInterval` and deletes expired sessions from `sec_user_session`.

This design demonstrates how to implement token revocation and single-login behavior without changing the JWT format — the server validates the `sid` claim against a DB-backed session store on every request.

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

## Handling Multiple logins

This implementation can optionally enforce a **single active session per user**. When enabled, logging in will revoke any existing sessions for the same username. This is controlled via the `sessions.single-login` property in the application YAML:

```yaml
sessions:
  single-login: false
  expiration: 30m
  cleanup-interval: 1h
```

- **`single-login: true`**  
  Only one active session per user is allowed. Any previous sessions will be revoked automatically when a new session is created.

- **`single-login: false`**  
  Users can maintain multiple concurrent sessions. Each session is managed independently, with its own expiration timestamp.

### Implementation Details

- When creating a session, the `UserSessionStore` checks the `single-login` property:

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

- The key behavior occurs in this block:

```java
if (props.isSingleLogin()) {
    repo.revokeByUsername(username);
    log.debug("Revoking sessions for: {}", username);
}
```

This ensures that:

1. Any existing sessions for the user are marked as revoked in the database.
2. The new session is the only valid active session for that user.
3. The `cleanupRequired` flag is set to ensure that scheduled cleanup tasks run when necessary.

- When single-login is disabled, multiple sessions can coexist, and the system tracks each session independently with its own expiration timestamp.
- Logging and database persistence remain consistent regardless of single-login mode, so the cleanup and session validation mechanisms work identically in both scenarios.


# Authorization Implementation

This section describes the authorization architecture implemented to support fine-grained access control in WebAPI using Spring Security's `@PreAuthorize` annotation with custom SpEL (Spring Expression Language) expressions.

## Overview

WebAPI uses a **two-tier permission system**:

1. **Global Permissions** (wildcard-based) - Stored in `sec_permission` table and evaluated via `WildcardPermission` class
   - Examples: `*`, `read`, `write`, `read:cohort`, `write:cohort`
   - Used for broad entitlements (e.g., "admin can write everything")

2. **Entity-Level Access** - Stored in `sec_{entity}` tables (e.g., `sec_cohort_definition`)
   - Tracks specific user access per entity (READ, WRITE) via ROLE
   - Used for granular permissions on user-created content
   - Prevents permission explosion (20k+ cohort definitions, 30k+ concept sets)

## Architecture

### Core Components

```
@PreAuthorize SpEL Expression
    ↓
WebApiSecurityExpressionRoot (SpEL entry points)
    ↓
AuthorizationService (coordination + future caching)
    ↓
EntityAccessService (encapsulates entity-specific access checks)
    ↓
{Entity}AccessRepository (JPA repositories for {entity}_sec tables)
```

### Design Principles

#### 1. Explicit Security Rules
All security rules are visible at the `@PreAuthorize` annotation level. Avoid hiding authorization logic in helper methods that obscure the actual access conditions.

**Good:**
```java
@PreAuthorize("isOwner(#id, COHORT_DEFINITION) or isPermitted('read:cohort')")
```

**Avoid:**
```java
@PreAuthorize("canRead(#id)")  // What does "canRead" check? Must trace through code.
```

#### 2. Separation of Concerns
- Domain entities (e.g., `CohortDefinition`) contain **no** authorization logic
- Entity access checking is isolated in `security.authz` package
- JPA repositories for `{entity}_sec` tables are separate from domain repositories

#### 3. Type Safety
- Use enums (`EntityType`, `AccessType`) in Java code
- Expose as constants in SpEL for clean syntax
- Avoid magic strings in authorization checks

#### 4. Performance Considerations
- Order checks from fastest to slowest (owner check → cached permission → DB query)
- `AuthorizationService` designed for future caching layer
- Entity access queries are optimized with `EXISTS` checks

#### 5. Scalability
- Avoid wildcard permissions for entity-level access (e.g., `cohort:read:123`)
- Use `{entity}_sec` tables to prevent permission explosion at scale (20k+ entities)
- Entity deletion automatically cascades to `{entity}_sec` rows via foreign key constraints

### Package Structure

```
security/authz/
  ├── AuthorizationService.java          # Coordination layer for authorization checks
  ├── AccessType.java                    # Enum: READ, WRITE, MANAGE
  ├── EntityType.java                    # Enum: COHORT_DEFINITION, CONCEPT_SET, ...
  ├── EntityAccessService.java           # Routes entity access checks to repositories
  ├── CohortDefinitionAccessEntity.java  # JPA entity for cohort_definition_sec table
  ├── CohortDefinitionAccessRepository.java  # Repository with @Query methods
  ├── WildcardPermission.java            # Shiro-style wildcard permission matching
  └── WildcardPermissionEvaluator.java   # Evaluates wildcard permissions

security/spring/
  ├── SpringSecurityConfig.java               # Spring SpEL extension beans
  ├── WebApiSecurityExpressionRoot.java       # Custom SpEL expressions + constants
  └── WebApiMethodSecurityExpressionHandler.java  # Creates expression root
```

## SpEL Constants and Methods

### Constants Available in @PreAuthorize

**Access Types:**
- `READ` - Read-only access
- `WRITE` - Modify and delete access

**Entity Types:**
- `COHORT_DEFINITION` - Cohort definitions
- `CONCEPT_SET` - Concept sets (future)

### Methods Available in @PreAuthorize

#### `isOwner(Long entityId, EntityType entityType)`
Checks if the current user is the creator of the entity (via `created_by_id` column). This is typically the fastest check and should be ordered first in combined expressions.

#### `hasEntityAccess(Long entityId, EntityType entityType, AccessType accessType)`
Checks if the user has specific access granted via the `{entity}_sec` table. This performs a database query and should be ordered last in combined expressions.

#### `isPermitted(String permission)`
Checks if the user has a global wildcard permission. Results are typically cached, making this faster than entity-specific checks but slower than ownership checks.

### Permission Hierarchy

**WRITE implies READ:**
Users granted WRITE access to an entity automatically have READ access. It would be impractical to grant update or delete permissions without allowing the user to view current state.

This hierarchy is enforced at the `@PreAuthorize` level by explicit checks rather than automatic implication, keeping security rules visible and traceable.

### Complete Usage Examples

The following examples demonstrate proper security decoration for common CRUD operations:

#### Create Operation
Only users with global cohort write entitlement can create new cohorts:

```java
@PreAuthorize("isAuthenticated() and isPermitted('write:cohort')")
@PostMapping("/cohort")
public CohortDefinition createCohort(@RequestBody CohortDefinition cohort) {
    // Set created_by_id to current user
    // ... implementation
}
```

#### Read Operation
Users can read if they are the owner, have global read entitlement, or have been granted READ access:

```java
@PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +              // 1. Check ownership (fast)
              "isPermitted('read:cohort') or " +                   // 2. Check global permission (cached)
              "hasEntityAccess(#id, COHORT_DEFINITION, READ)")     // 3. Check entity-specific (DB query)
@GetMapping("/cohort/{id}")
public CohortDefinition getCohort(@PathVariable Long id) { ... }
```

#### Update Operation
Users can update if they are the owner, have global write entitlement, or have been granted WRITE access. Note that WRITE access implicitly allows reading current state:

```java
@PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
              "isPermitted('write:cohort') or " + 
              "hasEntityAccess(#id, COHORT_DEFINITION, WRITE)")
@PutMapping("/cohort/{id}")
public CohortDefinition updateCohort(@PathVariable Long id, @RequestBody CohortDefinition cohort) {
    // ... implementation
}
```

#### Delete Operation
Users can delete if they are the owner, have global write entitlement, or have been granted WRITE access:

```java
@PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
              "isPermitted('write:cohort') or " + 
              "hasEntityAccess(#id, COHORT_DEFINITION, WRITE)")
@DeleteMapping("/cohort/{id}")
public void deleteCohort(@PathVariable Long id) {
    cohortRepo.deleteById(id);
}
```

**Ordering rationale:**
1. **Ownership check** → Fastest (simple principal.getUserId() comparison)
2. **Global permission** → Medium (cached permission set lookup)
3. **Entity-specific access** → Slowest (database query)

## Database Schema

### Global Permissions Tables

- `sec_user` - Users
- `sec_role` - Roles (including personal roles)
- `sec_permission` - Wildcard permissions
- `sec_role_permission` - Role → Permission assignments
- `sec_user_role` - User → Role assignments

### Entity-Level Access Tables

Each managed entity has a corresponding `{entity}_sec` table:

```sql
CREATE TABLE sec_cohort_definition(
    role_id int,
    cohort_definition_id int,
    access_type varchar(50) NOT NULL,  -- 'READ' or 'WRITE'
    CONSTRAINT PK_cohort_definition_sec PRIMARY KEY (role_id, cohort_definition_id, access_type),
    CONSTRAINT FK_cohort_definition_id FOREIGN KEY (cohort_definition_id) REFERENCES cohort_definition(id),
    CONSTRAINT FK_sec_role_id FOREIGN KEY (role_id) REFERENCES sec_role(id)
);
```


### Adding New Managed Entities

To add a new entity type (e.g., `concept_set`):

1. **Add to `EntityType` enum:**
   ```java
   public enum EntityType {
       COHORT_DEFINITION,
       CONCEPT_SET  // ← Add here
   }
   ```

2. **Create JPA entity for `sec_{entity}` table:**
   ```java
   @Entity
   @Table(name = "sec_concept_set")
   public class ConceptSetAccessEntity { ... }
   ```

3. **Create repository with queries:**
   ```java
   public interface ConceptSetAccessRepository extends JpaRepository<...> {
       boolean hasAccess(Long userId, Long conceptSetId, AccessType accessType);
       Long getCreatedById(Long conceptSetId);
   }
   ```

4. **Update `EntityAccessService`:**
   ```java
   public boolean hasEntityAccess(...) {
       return switch(entityType) {
           case COHORT_DEFINITION -> cohortDefAccessRepo.hasAccess(...);
           case CONCEPT_SET -> conceptSetAccessRepo.hasAccess(...);  // ← Add here
       };
   }
   ```

5. **Add constant to `WebApiSecurityExpressionRoot`:**
   ```java
   public final EntityType CONCEPT_SET = EntityType.CONCEPT_SET;
   ```

6. **Use in controllers:**
   ```java
   @PreAuthorize("isOwner(#id, CONCEPT_SET) or isPermitted('write:conceptset')")
   @PutMapping("/conceptset/{id}")
   public ConceptSet updateConceptSet(@PathVariable Long id) { ... }
   ```

## Example Controller Implementation

```java
@RestController
@RequestMapping("/api/cohorts")
public class CohortController {
    
    private final CohortDefinitionRepository cohortRepo;
    
    // Public list - anyone can see names
    @GetMapping
    public List<CohortDefinitionListProjection> listCohorts() {
      List<CohortDefinitionWithAccess> cohorts = cohortRepository.findAllWithAccessHints(authorizationService.getCurrentPrincipal().getUserId());
      return cohorts.stream()
        .map(c -> {
          var def = c.getCohortDefinition();
          return new CohortDefinitionListProjection(
              def.getId(),
              def.getName(),
              c.getCanRead(),
              c.getCanWrite());
        })
        .collect(Collectors.toList());
    }
    
    // Read full definition - owner, global read permission, or granted READ access
    @PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
                  "isPermitted('read:cohort') or " + 
                  "hasEntityAccess(#id, COHORT_DEFINITION, READ)")
    @GetMapping("/{id}")
    public CohortDefinition getCohort(@PathVariable Long id) {
        return cohortRepo.findById(id).orElseThrow();
    }
    
    // Update - owner, global write permission, or granted WRITE access
    @PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
                  "isPermitted('write:cohort') or " + 
                  "hasEntityAccess(#id, COHORT_DEFINITION, WRITE)")
    @PutMapping("/{id}")
    public CohortDefinition updateCohort(@PathVariable Long id, 
                                         @RequestBody CohortDefinition cohort) {
        // ... implementation
    }
    
    // Delete - owner, global write permission, or granted WRITE access
    @PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
                  "isPermitted('write:cohort') or " + 
                  "hasEntityAccess(#id, COHORT_DEFINITION, WRITE)")
    @DeleteMapping("/{id}")
    public void deleteCohort(@PathVariable Long id) {
        cohortRepo.deleteById(id);
    }
    
    // Create - any authenticated user with write permission
    @PreAuthorize("isAuthenticated() and isPermitted('write:cohort')")
    @PostMapping
    public CohortDefinition createCohort(@RequestBody CohortDefinition cohort) {
        // Set created_by_id to current user
        // ... implementation
    }
}
```

# Authorization use-cases included in this project

A series of users and permissons have been set up by default and the sections below describe the ways to invoke the endpoints via CURL to understand how login occurs and permissons enforced.

## Test Users and Permissions

The following test users are pre-populated in `/src/main/resources/stub/`:

### User: `anonymous` (unauthenticated)
**Global Permissions:**
- `read` - Can read all public content

**Entity Access:** None

**Use Case:** Public read-only access

---

### User: `alice`
**Credentials:** `alice` / `password1` (DB authentication)

**Global Permissions:**
- `read` (via "Public Users" role)

**Entity Access:** None (yet - can be granted via `cohort_definition_sec`)

**Use Case:** Basic authenticated user with read-only access

---

### User: `bob`
**Credentials:** `bob` / `password1` (DB authentication)

**Global Permissions:**
- `read` (via "Public Users" role)

**Entity Access:**
- **Owns:** Cohort Definition ID 1 ("bob cohort")

**Use Case:** Content creator - can fully manage their own cohort, read everything else

---

### User: `writeuser`
**Credentials:** `writeuser` / `password1` (DB authentication)

**Global Permissions:**
- `read` (via "Public Users" role)
- `write` (via personal role permission)

**Entity Access:** None needed - global write permission covers everything

**Use Case:** Power user with global write access to all entities

---

## Running Application Use-Cases

Summary of demo users, credentials and expected behaviors:

- **anonymous**  
  - Credentials: none (unauthenticated)  
  - Global permissions: `read` (public read access)  
  - Expected behavior: can list public cohorts and read public content only.
  - Example:
  ```bash
  # List public cohorts (no auth)
  curl -s http://localhost:8080/api/cohorts -w "\nHTTP_CODE:%{http_code}\n"
  ```

- **alice**  
  - Credentials: `alice` / `password1` (DB auth)  
  - Global permissions: `read`  
  - Expected behavior: can log in and read cohorts, but cannot update or delete others' cohorts.
  - Example:
  ```bash
  TOKEN=$(curl -s -u alice:password1 http://localhost:8080/user/login/db \
    | tr -d '\r\n' \
    | sed -n 's/.*"jwt"[[:space:]]*:[[:space:]]*"\([^"\]*\)".*/\1/p')
  # After extracting token into $TOKEN, attempt read (expected: 200 Allowed)
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/cohorts/1 -w "\nHTTP_CODE:%{http_code}\n"
  ```

  ```  
  # After extracting token into $TOKEN, attempt update (expected: 403 Forbidden)
curl -i -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"updated"}' \
  http://localhost:8080/api/cohorts/1 \
  -w "\nHTTP_CODE:%{http_code}\n"
  ```

- **bob**  
  - Credentials: `bob` / `password1` (DB auth)  
  - Global permissions: `read`  
  - Entity access: Owner of Cohort Definition ID `1` (created_by_id = bob)  
  - Expected behavior: can read, update and delete cohort `1` as owner.
  - Example:
  ```bash
  # Login and then fetch cohort 1 (expected: 200 with cohort JSON)
  TOKEN=$(curl -s -u bob:password1 http://localhost:8080/user/login/db \
    | tr -d '\r\n' \
    | sed -n 's/.*"jwt"[[:space:]]*:[[:space:]]*"\([^"\]*\)".*/\1/p')
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/cohorts/1 -w "\nHTTP_CODE:%{http_code}\n"
  ```

- **joe**  
  - Credentials: `joe` / `password1` (DB auth)  
  - Global permissions: `none`  
  - Entity access: Write-Access to Cohort Definition ID `1` (created_by_id = bob)  
  - Expected behavior: can read, update and delete cohort `1` as WRITE access.
  - Example 1:  Access with Write Access
  ```bash
  # Login and then fetch cohort 1 (expected: 200 with cohort JSON)
  TOKEN=$(curl -s -u joe:password1 http://localhost:8080/user/login/db \
    | tr -d '\r\n' \
    | sed -n 's/.*"jwt"[[:space:]]*:[[:space:]]*"\([^"\]*\)".*/\1/p')
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/cohorts/1 -w "\nHTTP_CODE:%{http_code}\n"
  ```
  - Example 2:  List Cohorts with Read/Write access hints
  ```bash
  # Login and then fetch cohort list
  TOKEN=$(curl -s -u joe:password1 http://localhost:8080/user/login/db \
    | tr -d '\r\n' \
    | sed -n 's/.*"jwt"[[:space:]]*:[[:space:]]*"\([^"\]*\)".*/\1/p')
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/cohorts -w "\nHTTP_CODE:%{http_code}\n"
  ```

- **writeuser**  
  - Credentials: `writeuser` / `password1` (DB auth)  
  - Global permissions: `read`, `write` (global write entitlement)  
  - Expected behavior: can create, update and delete cohorts across the system.
  - Example:
  ```bash
  # Login and create a new cohort (expected: 201 or 200 with created entity)
  TOKEN=$(curl -s -u writeuser:password1 http://localhost:8080/user/login/db \
    | tr -d '\r\n' \
    | sed -n 's/.*"jwt"[[:space:]]*:[[:space:]]*"\([^"\]*\)".*/\1/p')
  curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
       -d '{"name":"new cohort"}' http://localhost:8080/api/cohorts -w "\nHTTP_CODE:%{http_code}\n"
  ```

Notes:
- The demo login endpoint for DB auth is `/user/login/db` and accepts HTTP Basic credentials (curl `-u`).
  - Resource authorization follows the `@PreAuthorize` rules described earlier:
  - Read: `isOwner(#id, COHORT_DEFINITION) or isPermitted('read:cohort') or isPermitted('write:cohort') or hasEntityAccess(#id, COHORT_DEFINITION, READ) or hasEntityAccess(#id, COHORT_DEFINITION, WRITE)`
  - Write/Update/Delete: `isOwner(#id, COHORT_DEFINITION) or isPermitted('write:cohort') or hasEntityAccess(#id, COHORT_DEFINITION, WRITE)`
  - To see non-200 responses from CURL you can add `-w "\nHTTP_CODE:%{http_code}\n"` to the command to see the response.

---

