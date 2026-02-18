package org.ohdsi.sandbox.spring_authn.security.authz;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

/**
 *
 * @author gennadiy.anisimov
 */
public interface UserRoleRepository extends CrudRepository<UserRoleEntity, Long> {

  public List<UserRoleEntity> findByUser(UserEntity user);

  public Optional<UserRoleEntity> findByUserAndRole(UserEntity user, RoleEntity role);

  public List<UserRoleEntity> findByUserId(Long userId);

  public Optional<UserRoleEntity> findByUserIdAndRoleId(Long userId, Long roleId);

}
