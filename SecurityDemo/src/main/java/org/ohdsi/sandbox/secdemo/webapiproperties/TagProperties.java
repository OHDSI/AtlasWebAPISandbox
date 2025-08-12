package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class TagProperties {
    @NotBlank(message="tag-config.enabled must have a value")
    private Boolean enabled;

    @Positive(message="tag-config.refresh-stat-period-ms must be integer value > 0")
    private Integer refreshStatPeriodMs;

    public Boolean getEnabled() {
        return enabled;
    }
    public Boolean enabled() {
        return enabled;
    }
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Integer getRefreshStatPeriodMs() {
        return refreshStatPeriodMs;
    }
    public Integer refreshStatPeriodMs() {
        return refreshStatPeriodMs;
    }
    public void setRefreshStatPeriodMs(Integer refreshStatPeriodMs) {
        this.refreshStatPeriodMs = refreshStatPeriodMs;
    }
}

