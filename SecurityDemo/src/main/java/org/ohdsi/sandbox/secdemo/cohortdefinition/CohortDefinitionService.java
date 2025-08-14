package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CohortDefinitionService {
    private final List<CohortDefinition> cohortDefinitions = new ArrayList<>();

    public CohortDefinitionService() {
        // Create some fake cohort definitions
        for (long i = 0; i < 10; i++){
            var d = new CohortDefinition(
                    i,
                    "Cohort" + i,
                    "Cohort" + i + " description",
                    ExpressionType.SIMPLE_EXPRESSION,
                    new SecUser(42L + i, "User Number " + i));
            cohortDefinitions.add(d);
        }
    }

    public List<CohortDefinition> getCohortDefinitionsWithNoAuthorities() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var username = auth.getName();
        return cohortDefinitions;
    }

    public List<CohortDefinition> getCohortDefinitionsWithCohortReaderAuthorityFromCode() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var username = auth.getName();
        return cohortDefinitions;
    }

    @PreAuthorize("hasAuthority('cohort_reader')")
    public List<CohortDefinition> getCohortDefinitionsWithCohortReaderAuthorityFromAnnotation() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var username = auth.getName();
        return cohortDefinitions;
    }
}
