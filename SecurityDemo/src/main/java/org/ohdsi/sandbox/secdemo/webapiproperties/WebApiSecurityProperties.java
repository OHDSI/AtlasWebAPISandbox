package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.Valid;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

public class WebApiSecurityProperties {
    @Valid
    @NestedConfigurationProperty
    private AuthDbProperties authDb = new AuthDbProperties();

    @Valid
    @NestedConfigurationProperty
    private CorsProperties cors = new CorsProperties();

    Boolean defaultGlobalReadPermissions;

    String mode;

    String origin;

    public AuthDbProperties getAuthDb() {
        return authDb;
    }
    public AuthDbProperties authDb() {
        return authDb;
    }
    public void setAuthDb(AuthDbProperties authDb) {
        this.authDb = authDb;
    }

    public CorsProperties getCors() {
        return cors;
    }
    public CorsProperties cors() {
        return cors;
    }
    public void setCors(CorsProperties cors) {
        this.cors = cors;
    }

    public Boolean getDefaultGlobalReadPermissions() {
        return defaultGlobalReadPermissions;
    }
    public Boolean defaultGlobalReadPermissions() {
        return defaultGlobalReadPermissions;
    }
    public void setDefaultGlobalReadPermissions(Boolean defaultGlobalReadPermissions) {
        this.defaultGlobalReadPermissions = defaultGlobalReadPermissions;
    }

    public String getOrigin() {
        return origin;
    }
    public String origin() {
        return origin;
    }
    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getMode() {
        return mode;
    }
    public String mode() {
        return mode;
    }
    public void setMode(String mode) {
        this.mode = mode;
    }
}
