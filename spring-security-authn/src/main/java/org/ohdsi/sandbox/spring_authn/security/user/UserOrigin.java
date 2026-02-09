package org.ohdsi.sandbox.spring_authn.security.user;

import org.ohdsi.sandbox.spring_authn.security.provisioning.LdapProviderType;

public enum UserOrigin {
    SYSTEM, AD, LDAP;

    public static UserOrigin getFrom(LdapProviderType ldapProviderType) {
        switch (ldapProviderType) {
            case LDAP: return LDAP;
            case ACTIVE_DIRECTORY: return AD;
        }
        return SYSTEM;
    }
}
