package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.Positive;

public class ExecutionEngineProperties {
    Boolean invalidationEnabled;

    private Integer invalidationMaxAgeHours;

    private Integer invalidationPeriodMs;

    @Positive(message="webapi.execution-engine.max-zip-volume-size-mb must be positive")
    private Integer maxZipVolumeSizeMb;

    private String resultCallbackUrl;

    // This can be blank.  If a value is present, it is a comma-separated list of Ant path patterns
    // that are used to exclude any matching files from the results.
    private String resultExclusions;

    @Positive(message="webapi.execution-engine.status-period-ms must be positive")
    private String statusPeriodMs;

    private String token;

    private String updateStatusCallbackUrl;

    private String url;

    public Boolean getInvalidationEnabled() {
        return this.invalidationEnabled;
    }
    public Boolean invalidationEnabled() {
        return this.invalidationEnabled;
    }
    public void setInvalidationEnabled(Boolean invalidationEnabled) {
        this.invalidationEnabled = invalidationEnabled;
    }

    public Integer getInvalidationMaxAgeHours() {
        return invalidationMaxAgeHours;
    }
    public Integer invalidationMaxAgeHours() {
        return invalidationMaxAgeHours;
    }
    public void setInvalidationMaxAgeHours(Integer invalidationMaxAgeHours) {
        this.invalidationMaxAgeHours = invalidationMaxAgeHours;
    }

    public Integer getInvalidationPeriodMs() {
        return invalidationPeriodMs;
    }
    public Integer invalidationPeriodMs() {
        return invalidationPeriodMs;
    }
    public void setInvalidationPeriodMs(Integer invalidationPeriodMs) {
        this.invalidationPeriodMs = invalidationPeriodMs;
    }

    public Integer getMaxZipVolumeSizeMb() {
        return maxZipVolumeSizeMb;
    }
    public Integer maxZipVolumeSizeMb() {
        return maxZipVolumeSizeMb;
    }
    public void setMaxZipVolumeSizeMb(Integer maxZipVolumeSizeMb) {
        this.maxZipVolumeSizeMb = maxZipVolumeSizeMb;
    }

    public String getResultCallbackUrl() {
        return resultCallbackUrl;
    }
    public String resultCallbackUrl() {
        return resultCallbackUrl;
    }
    public void setResultCallbackUrl(String resultCallbackUrl) {
        this.resultCallbackUrl = resultCallbackUrl;
    }

    public String getResultExclusions() {
        return resultExclusions;
    }
    public String resultExclusions() {
        return resultExclusions;
    }
    public void setResultExclusions(String resultExclusions) {
        this.resultExclusions = resultExclusions;
    }

    public String getStatusPeriodMs() {
        return statusPeriodMs;
    }
    public String statusPeriodMs() {
        return statusPeriodMs;}
    public void setStatusPeriodMs(String statusPeriodMs) {
        this.statusPeriodMs = statusPeriodMs;
    }

    public String getToken() {
        return token;
    }
    public String token() {
        return token;}
    public void setToken(String token) {
        this.token = token;
    }

    public String getUpdateStatusCallbackUrl() {
        return updateStatusCallbackUrl;
    }
    public String updateStatusCallbackUrl() {
        return updateStatusCallbackUrl;
    }
    public void setUpdateStatusCallbackUrl(String updateStatusCallbackUrl) {
        this.updateStatusCallbackUrl = updateStatusCallbackUrl;
    }

    public String getUrl() {
        return url;
    }
    public String url() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
}
