package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

public class CdmResultsProperties {
    @Valid
    @NestedConfigurationProperty
    public CdmResultsAchillesProperties achilles = new CdmResultsAchillesProperties();

    @Valid
    @NestedConfigurationProperty
    public CdmResultsConceptRecordProperties conceptRecord = new CdmResultsConceptRecordProperties();

    @Valid
    @NestedConfigurationProperty
    public CdmResultsCronProperties cron = new CdmResultsCronProperties();

    @NotBlank(message="webapi.cdm-results.enable-cache-warming must have a value")
    Boolean enableCacheWarming;

    @Positive(message="webapi.cdm-results.jobs-count must be a positive integer")
    Integer jobsCount;

    public CdmResultsAchillesProperties getAchilles() {return achilles;}
    public CdmResultsAchillesProperties achilles() {return achilles;}
    public void setAchilles(CdmResultsAchillesProperties achilles) {this.achilles = achilles;}

    public CdmResultsConceptRecordProperties getConceptRecord() {return conceptRecord;}
    public CdmResultsConceptRecordProperties conceptRecord() {return conceptRecord;}
    public void setConceptRecord(CdmResultsConceptRecordProperties conceptRecord) {this.conceptRecord = conceptRecord;}

    public CdmResultsCronProperties getCron() {return cron;}
    public CdmResultsCronProperties cron() {return cron;}
    public void setCron(CdmResultsCronProperties cron) {this.cron = cron;}

    public Boolean getEnableCacheWarming() {return enableCacheWarming;}
    public Boolean enableCacheWarming() {return enableCacheWarming;}
    public void setEnableCacheWarming(Boolean enableCacheWarming) {this.enableCacheWarming = enableCacheWarming;}

    public Integer getJobsCount() {return jobsCount;}
    public Integer jobsCount() {return jobsCount;}
    public void setJobsCount(Integer jobsCount) {this.jobsCount = jobsCount;}
}
