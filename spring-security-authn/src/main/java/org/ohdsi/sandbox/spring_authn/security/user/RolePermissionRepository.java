package org.ohdsi.sandbox.spring_authn.security.user;

import java.util.List;

import org.ohdsi.sandbox.spring_authn.security.permission.PermissionEntity;
import org.springframework.data.repository.CrudRepository;

/**
 *
 * @author gennadiy.anisimov
 */
public interface RolePermissionRepository extends CrudRepository<RolePermissionEntity, Long> {
  
  RolePermissionEntity findByRoleAndPermission(RoleEntity role, PermissionEntity permission);

  RolePermissionEntity findByRoleIdAndPermissionId(Long roleId, Long permissionId);

  List<RolePermissionEntity> findByStatusIgnoreCase(String status);
}
