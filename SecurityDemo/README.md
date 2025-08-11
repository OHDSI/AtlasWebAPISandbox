# WebAPI Security Demo



## Authentication (AuthN) Overview

* Security filters intercept requests and determine if AuthN is required.  If it is, then either redirect user to a login page or use the details if user was previously authenticated.  For example, `UsernamePasswordAuthenticationFilter` extracts username/password from HTTP request.
* `AuthenticationManager` delegates to one or more authentication providers.
* `AuthenticationProvider ` (interface).  Implementations of this interface validate user details.  May use a `UserDetailsManager` and a `UserDetailsService` to retrieve/create/update/delete user details (for example, from a database system accessible to WebAPI).  `PasswordEncoder` implementations are used here.  The sandbox demonstrates the use of a `InMemoryUserDetailsManager` which defines user names and passwords in code.  A `JdbcUserDetailsManager` can be used to read user names and passwords from a datasource.  For LDAP there is a `LdapUserDetailsManager` ... and it is possible to create customized user details managers.
* `UserDetails` (interface).  Implementations of this interface (such as `User`) provide information about the user: username, password, assigned authorities, account status (expired, locked, etc).
* `Authentication`.  (interface)  The `Authentication` interface defines the basis for the implementations that store authentication information.  For example, the `UsernamePasswordAuthenticationToken` class is return when a username/password authentication approach is used.  An instance of the `Authentication` interface can store  a lot of useful information, and the instance is stored in a thread-local security context managed by a `SecurityContextHolder`.     A sampling of stored information:
  * `Principal` Identifies the user, can store user details, username, or other data based on the type of authentication.
  * `Credentials` - secret(s) used during authentication.  Usually cleared after authentication.
  * `Authorities` - a list of `GrantedAuthorities` (roles and permissions)
* `SecurityContext` is stored in a `ThreadLocal` instance, so it is always available to methods in the same thread.  If a REST endpoint is called and the implementation can span multiple threads, then care must be taken to provide the security context to those other threads.  Spring Security does provide `MODE_INHERITABLETHREADLOCAL` so that the security context can be copied to a new thread if asynchronous methods are used.  There's also a `MODEL_GLOBAL` sharing method but WebAPI cannot use that, because all users would then use the same security context.

### Password Encoding

Starting with Spring 5, a new "delegating" password encoder is used to encode passwords.  This works by placing a prefix in front of the password value that indicates the encoding type.  The current default (used by the Sandbox demo) is Bcrypt.  The list of very secure password encoders include:

* {bcrypt} - uses `BCryptPasswordEncoder`
* {pbdkf2} - uses `Pbdkf2PasswordEncoder`
* {scrypt} - uses `ScryptPasswordEncoder`
* {argon2} - uses `Argon2PasswordEncoder`

Less secure and/or legacy applications (such as current WebAPI) use approaches that are generally recognized as not secure:

* {noop} - Uses `NoOpPasswordEncoder` - no encryption is done.  Useful for testing.  Not for production.
* {sha256} - uses `StandardPasswordEncoder`
* {md5} - uses `MessageDigestPasswordEncoder`
* lots more...

*Note*: moving to a more secure password encryption may require some work on our part to *try* to upgrade existing encoded values, or may require that users provide new passwords.

### Authentication Mechanisms

#### Stateful

Uses a cookie/session id, where the session information is stored on the server.  Client must pass the cookie on each request.  A traditional approach.  May not scale well, and managing session data can add system complexity.

#### Stateless

Json Web Tokens (JWT) issued upon successful authentication.  The client then sends the token on each request.  JWTs can also store authorization information.

Note that both session cookies and JWT are vulnerable to Cross-Site Request Forgery attacks.  JWT generally less so, and vulnerability usually depends on how the client stores the JWT (cookies not so good).

### WebAPI "Disabled" Security

WebAPI 2.x currently implements a "disabled" security posture, which allows access to most of the REST endpoints.  Shiro configuration is used to prevent access to certain sensitive endpoints, such as those that involve user management (add/change/delete user/role/permission).  

WebAPI 3.x (and the sandbox demo) implement a similar capability, using the anonymous user feature of Spring Security.  Anonymous users are not authenticated, but they can follow the pattern provided by Spring Security:

* Routes can be restricted.
* Authorities (see below) can be granted.

This mode of operation is better treated as exclusive to regular authentication - although given Spring Security's flexibility it is possible to configure a mixture, where some endpoints are authenticated and others are accessible without authentication.

The sandbox demo uses the property `webapi.security.provider` to *DegradedSecurity* to demonstrate this mode of operation.

## Authorization (AuthZ) Overview

Unlike WebAPI 2.x, authorization is not path based.  We're not trying to control access to `DELETE /cohortdefinition/{id} `- but are instead controlling access based on whether the user has the authority to delete a cohort definition.

### Authorities

The `GrantedAuthority` interface defines a single method - `String getAuthority()`.  All roles and authorities are stored as strings.  Both the `Authentication` and `UserDetails` interfaces implement a `getAuthorities()` method, which returns a list of `GrantedAuthorities`.  Because these values are strings, it's very easy to create custom authorities - Spring does not define any standardized authorities.  It does provide a very powerful expression language known as SPeL - Spring Expression Language.

#### Roles

Roles function pretty much the same as in WebAPI 2.x, in that they group together individual authorities (permissions) that are granted to users with those roles.   When *defining* a role, Spring Security expects the prefix "ROLE_".  When testing to see if a user has the role the prefix should not be supplied.

#### Authorities

No prefix, no specific format.
