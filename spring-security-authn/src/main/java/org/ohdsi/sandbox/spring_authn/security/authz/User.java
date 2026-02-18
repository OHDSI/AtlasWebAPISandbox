package org.ohdsi.sandbox.spring_authn.security.authz;

import org.ohdsi.sandbox.spring_authn.security.authc.UserOrigin;

/**
 * Core User domain object.
 */
public record User(
    Long id,
    String login,
    String name,
    UserOrigin origin
) {

    /**
     * Converts a UserEntity to the User domain object.
     */
    public static User fromEntity(UserEntity entity) {
        return new User(
            entity.getId(),
            entity.getLogin(),
            entity.getName(),
            entity.getOrigin()
        );
    }
}
