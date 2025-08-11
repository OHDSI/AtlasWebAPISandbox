package org.ohdsi.sandbox.secdemo.cohortdefinition;

public record CohortDefinitionSummaryDTO(
        Long id,
        String name,
        String description,
        String type,
        Long createdByUser) {}
