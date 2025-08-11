package org.ohdsi.sandbox.secdemo.cohortdefinition;

public class CohortDefinitionDomainToCohortDefinitionSummaryDTO {
    public static CohortDefinitionSummaryDTO convert(CohortDefinition source) {
        var target = new CohortDefinitionSummaryDTO(
                source.getId(),
                source.getName(),
                source.getDescription(),
                source.getExpressionType().toString(),
                source.getCreatedBy().getId()
        );
        return target;
    }
}
