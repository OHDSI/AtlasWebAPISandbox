package org.ohdsi.sandbox.spring_authn.security.authz;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.ohdsi.sandbox.spring_authn.security.authc.UserOrigin;
import org.ohdsi.sandbox.spring_authn.security.identity.WebApiPrincipal;
import org.ohdsi.sandbox.spring_authn.util.SpringResourceHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.transaction.Transactional;

/**
 * The AuthorizatonService is part of security.authz which orchastrates the permission assignments for users, roles, and permisisons
 * AuthoriationService will serve as a fascade to the underlying package-local services that will freely exchange JPA Entities.
 */
@Service
public class AuthorizationService {

  private final UserService userService;
  private final RoleService roleService;
  private final JdbcTemplate jdbcTemplate;
  private final String ohdsiSchema;
  private final EntityAccessService entityAccessService;
    private ThreadLocal<ConcurrentHashMap<String, Set<String>>> authorizationInfoCache = ThreadLocal
      .withInitial(ConcurrentHashMap::new);

  public AuthorizationService(UserService userService,
      RoleService roleService,
      PermissionService permissionService,
      @Value("${datasource.ohdsi.schema}") String ohdsiSchema,
      JdbcTemplate jdbcTemplate,
      EntityAccessService entityAccessService) {

    this.userService = userService;
    this.roleService = roleService;
    this.ohdsiSchema = ohdsiSchema;
    this.jdbcTemplate = jdbcTemplate;
    this.entityAccessService = entityAccessService;
  }

   // -------------------------
    // Lifecycle / Registration
    // -------------------------

  /**
   * During login, we ensure the user exists in the system.  This was formerly known as 'registerUser'.
   * @param login the username to ensure exists, will create a new user if not
   * @param name the friendly name of this User, will use login if null
   * @param origin Indicates origin of the User
   * @param defaultRoles
   * @return
   */
  @Transactional
  public User ensureUserExists(String login, String name, UserOrigin origin, List<String> defaultRoles) {
    return userService.getUserByLogin(login)
        .map(entity -> updateIfNeeded(entity, name, origin))
        .orElseGet(() -> registerUser(login, name, origin, defaultRoles));
  }

  /**
   * Registers a user by creating the suer (and personal role) and assinging any default roles
   * Will result in an exception of personal role already exists (because that indicates some data issue)
   * @param login the login of the user
   * @param name The name of the user, will use login if null.
   * @param origin Records where this user was authenticated from initialy.
   * @param defaultRoles Sets up default roles to assign to this user.
   * @return
   */
  @Transactional
  public User registerUser(String login, String name, UserOrigin origin, List<String> defaultRoles) {

    this.roleService.getRoleByName(login, false)
      .ifPresent((role) -> {throw new RuntimeException("Can't create user when role for user %s already exists".formatted(login));});

    UserEntity userEntity = this.createUser(login, name, origin);

    // hard code for now to assign Public User role
    // should think about how to get set of roles new users should be granted by default,
    // in addition to roles that can be found via LDAP/AD

    RoleEntity publicRole = roleService.getRoleByName("Public Users", true).orElseThrow();
    roleService.addUserToRole(userEntity, publicRole, UserOrigin.SYSTEM);

    // Assign default roles
    if (defaultRoles != null) {
      for (String role : defaultRoles) {
        roleService.addUserToRole(login, role, origin);
      }
    }

    return User.fromEntity(userEntity);
  }

  private User updateIfNeeded(UserEntity entity, String name, UserOrigin origin) {
    boolean updated = false;
    if (name != null && !name.equals(entity.getName())) {
      entity.setName(name);
      updated = true;
    }
    if (origin != null && !origin.equals(entity.getOrigin())) {
      entity.setOrigin(origin);
      updated = true;
    }
    if (updated) {
      entity = userService.save(entity);
    }
    return User.fromEntity(entity);
  }  

/**
   * Creates a new user, assigning a personal role to the new user to hold personal permissions.
   * Will result in an exception of personal role already exists (because that indicates some data issue)
   * @param login the login of the user
   * @param name The name of the user, will use login if null.
   * @param origin Records where this user was authenticated from initialy.
   * @param defaultRoles Sets up default roles to assign to this user.
   * @return
   */
  @Transactional
  private UserEntity createUser(String login, String name, UserOrigin origin) {

    // personal role should not exist
    this.roleService.getRoleByName(login, false)
      .ifPresent((role) -> {throw new RuntimeException("Can't create user when role for user %s already exists".formatted(login));});

    UserEntity userEntity = new UserEntity();
    userEntity.setLogin(login);
    userEntity.setName(name != null ? name : login);
    userEntity.setOrigin(origin != null ? origin : UserOrigin.SYSTEM);
    userEntity = userService.save(userEntity);

    // Assign personal role
    RoleEntity roleEntity = roleService.addRole(login, false);

    roleService.addUserToRole(userEntity, roleEntity, origin);

    return userEntity;
  }

  // -------------------------
  // User Authorization Operations
  // -------------------------

  /**
   * Gets the current user's login (username)
   * @return
   */
  public String getCurrentLogin() {
    return SecurityContextHolder.getContext()
        .getAuthentication()
        .getName();
  }

  /**
   * Return the permissions for the specified login
   * 
   * @param login The login to fetch the authorization info
   * @return A List of String representing permissions.
   */
  public Set<String> getAuthorizationInfo(WebApiPrincipal principal) {
    return authorizationInfoCache.get().computeIfAbsent(principal.getName(), newLogin -> {
      return queryUserPermissions(principal);
    });
  }

  /**
   * Clears the permission cache
   */
  public void clearAuthorizationInfoCache() {
    authorizationInfoCache.set(new ConcurrentHashMap<>());
  }

  public Set<String> queryUserPermissions(WebApiPrincipal principal) {
    String permQuery = StringUtils.replace(
        SpringResourceHelper.getResourceAsString("security/getPermissionsForUser.sql"),
        "@ohdsi_schema",
        this.ohdsiSchema);

    final UserEntity user = userService.getUserByLogin(principal.getName()).orElseThrow();

    List<String> permissions = this.jdbcTemplate.query(
        permQuery,
        (ps) -> {
          ps.setLong(1, user.getId());
        },
        (rs, rowNum) -> {
          return rs.getString("value");
        });
    return new HashSet<>(permissions);
  }

  // -------------------------
  // Entity-Level Authorization (for @PreAuthorize SpEL expressions)
  // -------------------------

  /**
   * Check if the current principal is the owner of an entity
   * @param entityId The entity ID
   * @param entityType The type of entity
   * @return true if the principal created the entity
   */
  public boolean isOwner(Long entityId, EntityType entityType) {
    WebApiPrincipal principal = getCurrentPrincipal();
    if (principal == null) {
      return false;
    }
    
    Long ownerId = entityAccessService.getOwnerId(entityId, entityType);
    return ownerId != null && ownerId.equals(principal.getUserId());
  }

  /**
   * Check if the current principal has specific access to an entity via {entity}_sec table
   * @param entityId The entity ID
   * @param entityType The type of entity
  * @param accessType The type of access (READ, WRITE)
   * @return true if the principal has the specified access
   */
  public boolean hasEntityAccess(Long entityId, EntityType entityType, AccessType accessType) {
    WebApiPrincipal principal = getCurrentPrincipal();
    if (principal == null) {
      return false;
    }

    return entityAccessService.hasEntityAccess(principal.getUserId(), entityId, entityType, accessType);
  }

  /**
   * Check if the current principal has a wildcard permission (global entitlement)
   * @param permission The permission string (e.g., "read:cohort", "write", "*")
   * @return true if the principal has the permission
   */
  public boolean isPermitted(String permission) {
    WebApiPrincipal principal = getCurrentPrincipal();
    if (principal == null) {
      return false;
    }

    Set<String> perms = getAuthorizationInfo(principal);
    return WildcardPermission.impliesAny(perms, permission);
  }

  /**
   * Get the current principal from the security context
   */
  private WebApiPrincipal getCurrentPrincipal() {
    var authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.getPrincipal() instanceof WebApiPrincipal principal) {
      return principal;
    }
    return null;
  }

}

