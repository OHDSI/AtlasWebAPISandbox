package org.ohdsi.sandbox.spring_authn.security.authz;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

/**
 * Created by GMalikov on 24.08.2015.
 */
public interface PermissionRepository extends CrudRepository<PermissionEntity, Long> {

  public Optional<PermissionEntity> findByValueIgnoreCase(String permission);

}
