package org.ohdsi.sandbox.secdemo.cohortdefinition.converter;

import org.ohdsi.sandbox.secdemo.cohortdefinition.dto.CohortDefinitionSummaryDTO;
import org.ohdsi.sandbox.secdemo.domain.CohortDefinitionDomain;

public class CohortDefinitionDomainToCohortDefinitionSummaryDTO {
    public static CohortDefinitionSummaryDTO convert(CohortDefinitionDomain source) {
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
