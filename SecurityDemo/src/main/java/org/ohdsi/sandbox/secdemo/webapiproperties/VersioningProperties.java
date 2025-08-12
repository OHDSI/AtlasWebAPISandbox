package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.Positive;

public class VersioningProperties {
    @Positive(message="versioning.save-version-retry-count must be an integer value > 0")
    public Integer saveVersionRetryCount;

    public Integer getSaveVersionRetryCount() {
        return saveVersionRetryCount;
    }
    public Integer saveVersionRetryCount() {
        return saveVersionRetryCount;
    }
    public void setSaveVersionRetryCount(Integer saveVersionRetryCount) {
        this.saveVersionRetryCount = saveVersionRetryCount;
    }
}
