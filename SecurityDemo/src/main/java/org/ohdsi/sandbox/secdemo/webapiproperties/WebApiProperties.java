package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.Valid;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Validated
@Component
@ConfigurationProperties(prefix="webapi")
public class WebApiProperties {
    @Valid
    @NestedConfigurationProperty
    private AppDbProperties appDb = new AppDbProperties();

    public AppDbProperties getAppDb() {
        return appDb;
    }
    public AppDbProperties appDb() {
        return this.appDb;
    }
    public void setAppDb(AppDbProperties appDb) {
        this.appDb = appDb;
    }

    @Valid
    @NestedConfigurationProperty
    public AuditTrailProperties auditTrail = new AuditTrailProperties();

    public AuditTrailProperties getAuditTrail() {
        return auditTrail;
    }
    public AuditTrailProperties auditTrail() {
        return auditTrail;
    }
    public void setAuditTrail(AuditTrailProperties auditTrail) {
        this.auditTrail = auditTrail;
    }

    @Valid
    @NestedConfigurationProperty
    public CdmDbProperties cdmDb = new CdmDbProperties();

    public CdmDbProperties getCdmDb() {
        return cdmDb;
    }
    public CdmDbProperties cdmDb() {
        return cdmDb;
    }
    public void setCdmDb(CdmDbProperties cdmDb) {
        this.cdmDb = cdmDb;
    }

    @Valid
    @NestedConfigurationProperty
    public CdmResultsProperties cdmResults = new CdmResultsProperties();

    public CdmResultsProperties getCdmResults() {
        return cdmResults;
    }
    public CdmResultsProperties cdmResults() {
        return cdmResults;
    }
    public void setCdmResults(CdmResultsProperties cdmResults) {
        this.cdmResults = cdmResults;
    }

    @Valid
    @NestedConfigurationProperty
    public ExecutionEngineProperties executionEngine = new ExecutionEngineProperties();
    public ExecutionEngineProperties getExecutionEngine() {
        return executionEngine;
    }
    public ExecutionEngineProperties executionEngine() {
        return executionEngine;
    }
    public void setExecutionEngine(ExecutionEngineProperties executionEngine) {
        this.executionEngine = executionEngine;
    }

    @Valid
    @NestedConfigurationProperty
    public HeraclesProperties heracles = new HeraclesProperties();

    public HeraclesProperties getHeracles() {
        return heracles;
    }
    public HeraclesProperties heracles() {
        return heracles;
    }
    public void setHeracles(HeraclesProperties heracles) {
        this.heracles = heracles;
    }

    @Valid
    @NestedConfigurationProperty
    public I18nProperties i18n = new I18nProperties();

    public I18nProperties getI18n() {
        return i18n;
    }
    public I18nProperties i18n() {
        return i18n;
    }
    public void setI18n(I18nProperties i18n) {
        this.i18n = i18n;
    }

    @Valid
    @NestedConfigurationProperty
    public WebApiSecurityProperties security = new WebApiSecurityProperties();
    public WebApiSecurityProperties getSecurity() {
        return security;
    }
    public WebApiSecurityProperties security() {
        return security;
    }
    public void setSecurity(WebApiSecurityProperties security) {
        this.security = security;
    }

    @Valid
    @NestedConfigurationProperty
    public TagProperties tag = new TagProperties();
    public TagProperties getTag() {
        return tag;
    }
    public TagProperties tag() {
        return tag;
    }
    public void setTag(TagProperties tag) {
        this.tag = tag;
    }

    @Valid
    @NestedConfigurationProperty
    public UserProperties user = new UserProperties();
    public UserProperties getUser() {
        return user;
    }
    public UserProperties user() {
        return user;
    }
    public void setUser(UserProperties user) {
        this.user = user;
    }

    @Valid
    @NestedConfigurationProperty
    public VersioningProperties versioning = new VersioningProperties();
    public VersioningProperties getVersioning() {
        return versioning;
    }
    public VersioningProperties versioning() {
        return versioning;
    }
    public void setVersioning(VersioningProperties versioning) {
        this.versioning = versioning;
    }
}