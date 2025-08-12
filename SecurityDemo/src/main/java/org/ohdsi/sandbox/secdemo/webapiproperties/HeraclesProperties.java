package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.Positive;

public class HeraclesProperties {
    @Positive(message="webapi.heracles.small-cell-count must be > 0")
    private Integer smallCellCount;

    public Integer getSmallCellCount() {
        return smallCellCount;
    }
    public Integer smallCellCount() {
        return smallCellCount;
    }
    public void setSmallCellCount(Integer smallCellCount) {
        this.smallCellCount = smallCellCount;
    }
}
