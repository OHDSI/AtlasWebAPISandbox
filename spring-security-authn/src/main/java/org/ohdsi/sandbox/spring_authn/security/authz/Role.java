package org.ohdsi.sandbox.spring_authn.security.authz;

/**
 * Core Role domain object.
 */
public record Role(
    Long id,
    String name,
    boolean systemRole
) {

    /**
     * Converts a RoleEntity to the Role domain object.
     */
    public static Role fromEntity(RoleEntity entity) {
        return new Role(
            entity.getId(),
            entity.getName(),
            Boolean.TRUE.equals(entity.isSystemRole())
        );
    }
}
