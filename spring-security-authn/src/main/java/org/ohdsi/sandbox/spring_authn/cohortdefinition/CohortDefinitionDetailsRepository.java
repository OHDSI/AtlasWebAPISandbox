package org.ohdsi.sandbox.spring_authn.cohortdefinition;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CohortDefinitionDetailsRepository extends JpaRepository<CohortDefinitionDetails, Long> {
}
