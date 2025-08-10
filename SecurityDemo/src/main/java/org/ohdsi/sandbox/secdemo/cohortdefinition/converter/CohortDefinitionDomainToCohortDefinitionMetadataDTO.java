package org.ohdsi.sandbox.secdemo.cohortdefinition.converter;

import org.ohdsi.sandbox.secdemo.cohortdefinition.dto.CohortDefinitionMetadataDTO;
import org.ohdsi.sandbox.secdemo.domain.CohortDefinitionDomain;

public class CohortDefinitionDomainToCohortDefinitionMetadataDTO {
    public static CohortDefinitionMetadataDTO convert(CohortDefinitionDomain source) {
        var target = new CohortDefinitionMetadataDTO(
                source.getId(),
                source.getName(),
                source.getDescription(),
                source.getExpressionType().toString(),
                source.getCreatedBy().getId()
        );
        return target;
    }
}
