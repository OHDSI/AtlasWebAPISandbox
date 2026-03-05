package org.ohdsi.sandbox.spring_authn.cohortdefinition;

/**
 * Projection interface for listing cohort definitions with authorization hints.
 */
public record CohortDefinitionListProjection (
  Integer id,
  String name,
  Boolean canRead,
  Boolean canWrite
){}
