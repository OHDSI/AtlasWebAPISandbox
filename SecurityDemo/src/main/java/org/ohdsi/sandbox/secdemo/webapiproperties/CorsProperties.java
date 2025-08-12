package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.NotBlank;

public class CorsProperties {
    @NotBlank(message="cors.enabled must have a value")
    Boolean enabled;

    public Boolean getEnabled() {
        return enabled;
    }
    public Boolean enabled() {
        return enabled;
    }
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
