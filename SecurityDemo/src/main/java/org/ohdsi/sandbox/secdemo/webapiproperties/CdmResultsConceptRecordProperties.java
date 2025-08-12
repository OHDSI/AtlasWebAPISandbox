package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.NotBlank;

public class CdmResultsConceptRecordProperties {
    @NotBlank(message="webapi.cdm-results.concept-record.use-person-count must have a value")
    Boolean usePersonCount;

    public Boolean getUsePersonCount() {return usePersonCount;}
    public Boolean usePersonCount() {return usePersonCount;}
    public void setUsePersonCount(Boolean usePersonCount) {this.usePersonCount = usePersonCount;}
}
