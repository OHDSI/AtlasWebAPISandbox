package org.ohdsi.sandbox.spring_authn.security.authz;

import java.util.Set;

import org.ohdsi.sandbox.spring_authn.security.permission.PermissionManager;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;


@Component
public class WildcardPermissionEvaluator {

  private final PermissionManager permissionManager;

  public WildcardPermissionEvaluator(PermissionManager permissionManager) {
    this.permissionManager = permissionManager;
  }

  public boolean isPermitted(Authentication authentication, String permission) {

    if (authentication == null || !authentication.isAuthenticated()) {
      return false;
    }

    String username = authentication.getName();
    Set<String> permissons = permissionManager.getAuthorizationInfo(username);

    // Global wildcard, quick check to bypass everything
    if (permissons.contains("*")) {
      return true;
    }

    // Shiro-style wildcard implication
    return WildcardPermission.impliesAny(permissons, permission);
  }
}