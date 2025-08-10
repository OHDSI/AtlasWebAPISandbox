package org.ohdsi.sandbox.secdemo.cohortdefinition.dto;

public record CohortDefinitionMetadataDTO(
        Long id,
        String name,
        String description,
        String type,
        Long createdByUser) {}
