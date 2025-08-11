package org.ohdsi.sandbox.secdemo.cohortdefinition.dto;

public record CohortDefinitionSummaryDTO(
        Long id,
        String name,
        String description,
        String type,
        Long createdByUser) {}
