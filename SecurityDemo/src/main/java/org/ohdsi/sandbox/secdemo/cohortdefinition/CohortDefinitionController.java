package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/")
public class CohortDefinitionController {
	private final List<CohortDefinition> cohortDefinitions = new ArrayList<>();

	public CohortDefinitionController() {
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

	// Return all cohort definition summaries.  Here no authorities are required.
	@GetMapping("/cohortdefinition/with_no_authorities")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionList() {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		var username = auth.getName();

		// Convert the cohortdefinition list to a list of summary DTOs, return to user.
		var dtos = cohortDefinitions.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}

	// Return all cohort definition summaries.  The user is required to have
	// the "cohortreader" authority, which is set in the security/RegularSecurity class.
	@GetMapping("/cohortdefinition/require_cohortreader_authority_via_code")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionListRequireCohortReaderAuthorityViaCode() {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		var username = auth.getName();

		// Convert the cohortdefinition list to a list of summary DTOs, return to user.
		var dtos = cohortDefinitions.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}

	// Return all cohort definition summaries.  Here a security annotation is used to
	// make sure that the user has the required "cohortreader" authority.  Note:
	// pre-authorize is the default and is enabled automatically.
	@PreAuthorize("hasAuthority('cohort_reader')")
	@GetMapping("/cohortdefinition/require_cohort_reader_authority_via_annotation")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionListRequireCohortReaderAuthorityViaAnnotation() {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		var username = auth.getName();

		// Convert the cohortdefinition list to a list of summary DTOs, return to user.
		var dtos = cohortDefinitions.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}
}
