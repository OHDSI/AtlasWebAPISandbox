package org.ohdsi.sandbox.spring_authn.security.permission;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.ohdsi.sandbox.spring_authn.security.user.RoleEntity;
import org.ohdsi.sandbox.spring_authn.security.user.RolePermissionEntity;
import org.ohdsi.sandbox.spring_authn.security.user.RolePermissionRepository;
import org.ohdsi.sandbox.spring_authn.security.user.RoleRepository;
import org.ohdsi.sandbox.spring_authn.security.user.UserEntity;
import org.ohdsi.sandbox.spring_authn.security.user.UserOrigin;
import org.ohdsi.sandbox.spring_authn.security.user.UserRepository;
import org.ohdsi.sandbox.spring_authn.security.user.UserRoleEntity;
import org.ohdsi.sandbox.spring_authn.security.user.UserRoleRepository;
import org.ohdsi.sandbox.spring_authn.util.SpringResourceHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

/**
 *
 * @author gennadiy.anisimov, chrisknoll
 */
@Component
@Transactional
public class PermissionManager {

  @Value("${datasource.ohdsi.schema}")
  private String ohdsiSchema;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private RoleRepository roleRepository;

  @Autowired
  private PermissionRepository permissionRepository;

  @Autowired
  private RolePermissionRepository rolePermissionRepository;

  @Autowired
  private UserRoleRepository userRoleRepository;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  private ThreadLocal<ConcurrentHashMap<String, Set<String>>> authorizationInfoCache = ThreadLocal
      .withInitial(ConcurrentHashMap::new);

  public static class PermissionsDTO {

    public Map<String, List<String>> permissions = null;
  }

  public RoleEntity addRole(String roleName, boolean isSystem) {

    Assert.hasLength(roleName, "roleName must not be null or empty");
    ;
    checkRoleIsAbsent(roleName, isSystem, "Can't create role - it already exists");

    RoleEntity role = new RoleEntity();
    role.setName(roleName);
    role.setSystemRole(isSystem);
    role = this.roleRepository.save(role);

    return role;
  }

  public String addUserToRole(String roleName, String login) {
    return addUserToRole(roleName, login, UserOrigin.SYSTEM);
  }

  public String addUserToRole(String roleName, String login, UserOrigin userOrigin) {
    Assert.hasLength(roleName, "roleName can not be empty.");
    Assert.hasLength(login, "login can not be empty");

    RoleEntity role = this.getSystemRoleByName(roleName);
    UserEntity user = this.getUserByLogin(login);

    UserRoleEntity userRole = this.addUser(user, role, userOrigin, null);
    return userRole.getStatus();
  }

  public void removeUserFromRole(String roleName, String login, UserOrigin origin) {
    Assert.hasLength(roleName, "roleName can not be empty.");
    Assert.hasLength(login, "login can not be empty");

    if (roleName.equalsIgnoreCase(login))
      throw new RuntimeException("Can't remove user from personal role");

    RoleEntity role = this.getSystemRoleByName(roleName);
    UserEntity user = this.getUserByLogin(login);

    UserRoleEntity userRole = this.userRoleRepository.findByUserAndRole(user, role);
    if (userRole != null && (origin == null || origin.equals(userRole.getOrigin())))
      this.userRoleRepository.delete(userRole);
  }

  public Iterable<RoleEntity> getRoles(boolean includePersonalRoles) {

    if (includePersonalRoles) {
      return this.roleRepository.findAll();
    } else {
      return this.roleRepository.findAllBySystemRoleTrue();
    }
  }

  /**
   * Return the UserSimpleAuthorizastionInfo which contains the login, roles and
   * permissions for the specified login
   * 
   * @param login The login to fetch the authorization info
   * @return A List of String representing permissions.
   */
  public Set<String> getAuthorizationInfo(final String login) {

    return authorizationInfoCache.get().computeIfAbsent(login, newLogin -> {
      Set<String> permissions = this.queryUserPermissions(login);

      return permissions;
    });
  }

  public void clearAuthorizationInfoCache() {
    authorizationInfoCache.set(new ConcurrentHashMap<>());
  }

  @Transactional
  public UserEntity registerUser(final String login, final String name, final Set<String> defaultRoles) {
    return registerUser(login, name, UserOrigin.SYSTEM, defaultRoles);
  }

  @Transactional
  public UserEntity registerUser(final String login, final String name, final UserOrigin userOrigin,
      final Set<String> defaultRoles) {
    Assert.hasLength(login, "login can not be empty");

    UserEntity user = userRepository.findByLogin(login);
    if (user != null) {
      if (user.getName() == null || !userOrigin.equals(user.getOrigin())) {
        String nameToSet = name;
        if (name == null) {
          nameToSet = login;
        }
        user.setName(nameToSet);
        user.setOrigin(userOrigin);
        user = userRepository.save(user);
      }
      return user;
    }

    checkRoleIsAbsent(login, false, "User with such login has been improperly removed from the database. " +
        "Please contact your system administrator");
    user = new UserEntity();
    user.setLogin(login);
    user.setName(name);
    user.setOrigin(userOrigin);
    user = userRepository.save(user);

    RoleEntity personalRole = this.addRole(login, false);
    this.addUser(user, personalRole, userOrigin, null);

    if (defaultRoles != null) {
      for (String roleName : defaultRoles) {
        RoleEntity defaultRole = this.getSystemRoleByName(roleName);
        if (defaultRole != null) {
          this.addUser(user, defaultRole, userOrigin, null);
        }
      }
    }

    user = userRepository.findById(user.getId()).orElseThrow();
    return user;
  }

  public Iterable<UserEntity> getUsers() {
    return this.userRepository.findAll();
  }

  public PermissionEntity getOrAddPermission(final String permissionName, final String permissionDescription) {
    Assert.hasLength(permissionName, "permissionName can not be empty.");

    PermissionEntity permission = this.permissionRepository.findByValueIgnoreCase(permissionName);
    if (permission != null) {
      return permission;
    }

    permission = new PermissionEntity();
    permission.setValue(permissionName);
    permission.setDescription(permissionDescription);
    permission = this.permissionRepository.save(permission);
    return permission;
  }

  public Set<RoleEntity> getUserRoles(Long userId) throws Exception {
    UserEntity user = this.getUserById(userId);
    Set<RoleEntity> roles = this.getUserRoles(user);
    return roles;
  }

  public Iterable<PermissionEntity> getPermissions() {
    return this.permissionRepository.findAll();
  }

  public Set<PermissionEntity> getUserPermissions(Long userId) {
    UserEntity user = this.getUserById(userId);
    Set<PermissionEntity> permissions = this.getUserPermissions(user);
    return permissions;
  }

  public void removeRole(Long roleId) {
    this.roleRepository.deleteById(roleId);
  }

  public Set<PermissionEntity> getRolePermissions(Long roleId) {
    RoleEntity role = this.getRoleById(roleId);
    Set<PermissionEntity> permissions = this.getRolePermissions(role);
    return permissions;
  }

  public void addPermission(Long roleId, Long permissionId) {
    PermissionEntity permission = this.getPermissionById(permissionId);
    RoleEntity role = this.getRoleById(roleId);

    this.addPermission(role, permission);
  }

  public void removePermission(Long permissionId, Long roleId) {
    RolePermissionEntity rolePermission = this.rolePermissionRepository.findByRoleIdAndPermissionId(roleId,
        permissionId);
    if (rolePermission != null)
      this.rolePermissionRepository.delete(rolePermission);
  }

  public Set<UserEntity> getRoleUsers(Long roleId) {
    RoleEntity role = this.getRoleById(roleId);
    Set<UserEntity> users = this.getRoleUsers(role);
    return users;
  }

  public void addUser(Long userId, Long roleId) {
    UserEntity user = this.getUserById(userId);
    RoleEntity role = this.getRoleById(roleId);

    this.addUser(user, role, UserOrigin.SYSTEM, null);
  }

  public void removeUser(Long userId, Long roleId) {
    UserRoleEntity userRole = this.userRoleRepository.findByUserIdAndRoleId(userId, roleId);
    if (userRole != null)
      this.userRoleRepository.delete(userRole);
  }

  public void removePermission(String value) {
    PermissionEntity permission = this.permissionRepository.findByValueIgnoreCase(value);
    if (permission != null)
      this.permissionRepository.delete(permission);
  }

  public RoleEntity getUserPersonalRole(String username) {

    return this.getRoleByName(username, false);
  }

  public RoleEntity getCurrentUserPersonalRole() {
    String username = this.getSubjectName();
    return getUserPersonalRole(username);
  }

  private void checkRoleIsAbsent(String roleName, boolean isSystem, String message) {
    RoleEntity role = this.roleRepository.findByNameAndSystemRole(roleName, isSystem);
    if (role != null) {
      throw new RuntimeException(message);
    }
  }

  public Set<PermissionEntity> getUserPermissions(UserEntity user) {
    Set<RoleEntity> roles = this.getUserRoles(user);
    Set<PermissionEntity> permissions = new LinkedHashSet<>();

    for (RoleEntity role : roles) {
      permissions.addAll(this.getRolePermissions(role));
    }

    return permissions;
  }

  public Set<String> queryUserPermissions(final String login) {
    String permQuery = StringUtils.replace(
        SpringResourceHelper.getResourceAsString("/resources/security/getPermissionsForUser.sql"),
        "@ohdsi_schema",
        this.ohdsiSchema);
    final UserEntity user = userRepository.findByLogin(login);

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

  private Set<PermissionEntity> getRolePermissions(RoleEntity role) {
    Set<PermissionEntity> permissions = new LinkedHashSet<>();

    Set<RolePermissionEntity> rolePermissions = role.getRolePermissions();
    for (RolePermissionEntity rolePermission : rolePermissions) {
      permissions.add(rolePermission.getPermission());
    }

    return permissions;
  }

  private Set<RoleEntity> getUserRoles(UserEntity user) {
    Set<UserRoleEntity> userRoles = user.getUserRoles();
    Set<RoleEntity> roles = new LinkedHashSet<>();
    for (UserRoleEntity userRole : userRoles) {
      roles.add(userRole.getRole());
    }

    return roles;
  }

  private Set<UserEntity> getRoleUsers(RoleEntity role) {
    Set<UserEntity> users = new LinkedHashSet<>();
    for (UserRoleEntity userRole : role.getUserRoles()) {
      users.add(userRole.getUser());
    }
    return users;
  }

  public UserEntity getCurrentUser() {
    final String login = this.getSubjectName();
    final UserEntity currentUser = this.getUserByLogin(login);
    return currentUser;
  }

  public UserEntity getUserById(Long userId) {
    UserEntity user = this.userRepository.findById(userId).orElseThrow();
    return user;
  }

  private UserEntity getUserByLogin(final String login) {
    final UserEntity user = this.userRepository.findByLogin(login);
    if (user == null)
      throw new RuntimeException("User doesn't exist");

    return user;
  }

  private RoleEntity getRoleByName(String roleName, Boolean isSystemRole) {
    final RoleEntity roleEntity = this.roleRepository.findByNameAndSystemRole(roleName, isSystemRole);
    if (roleEntity == null)
      throw new RuntimeException("Role doesn't exist");

    return roleEntity;
  }

  public RoleEntity getSystemRoleByName(String roleName) {
    return getRoleByName(roleName, true);
  }

  private RoleEntity getRoleById(Long roleId) {
    final RoleEntity roleEntity = this.roleRepository.findById(roleId).orElseThrow();
    return roleEntity;
  }

  private PermissionEntity getPermissionById(Long permissionId) {
    final PermissionEntity permission = this.permissionRepository.findById(permissionId).orElseThrow();
    return permission;
  }

  private RolePermissionEntity addPermission(final RoleEntity role, final PermissionEntity permission) {
    RolePermissionEntity relation = this.rolePermissionRepository.findByRoleAndPermission(role, permission);
    if (relation == null) {
      relation = new RolePermissionEntity();
      relation.setRole(role);
      relation.setPermission(permission);
      relation = this.rolePermissionRepository.save(relation);
    }

    return relation;
  }

  private UserRoleEntity addUser(final UserEntity user, final RoleEntity role,
      final UserOrigin userOrigin, final String status) {
    UserRoleEntity relation = this.userRoleRepository.findByUserAndRole(user, role);
    if (relation == null) {
      relation = new UserRoleEntity();
      relation.setUser(user);
      relation.setRole(role);
      relation.setStatus(status);
      relation.setOrigin(userOrigin);
      relation = this.userRoleRepository.save(relation);
    }

    return relation;
  }

  public String getSubjectName() {
    return SecurityContextHolder.getContext()
        .getAuthentication()
        .getName();
  }

  public RoleEntity getRole(Long id) {
    return this.roleRepository.findById(id).orElseThrow();
  }

  public RoleEntity updateRole(RoleEntity roleEntity) {
    return this.roleRepository.save(roleEntity);
  }

  public void addPermissionsFromTemplate(RoleEntity roleEntity, Map<String, String> template, String value) {
    for (Map.Entry<String, String> entry : template.entrySet()) {
      String permission = String.format(entry.getKey(), value);
      String description = String.format(entry.getValue(), value);
      PermissionEntity permissionEntity = this.getOrAddPermission(permission, description);
      this.addPermission(roleEntity, permissionEntity);
    }
  }

  public void addPermissionsFromTemplate(Map<String, String> template, String value) {
    RoleEntity currentUserPersonalRole = getCurrentUserPersonalRole();
    addPermissionsFromTemplate(currentUserPersonalRole, template, value);
  }

  public void removePermissionsFromTemplate(Map<String, String> template, String value) {
    for (Map.Entry<String, String> entry : template.entrySet()) {
      String permission = String.format(entry.getKey(), value);
      this.removePermission(permission);
    }
  }

  public boolean roleExists(String roleName) {
    return this.roleRepository.existsByName(roleName);
  }
}
