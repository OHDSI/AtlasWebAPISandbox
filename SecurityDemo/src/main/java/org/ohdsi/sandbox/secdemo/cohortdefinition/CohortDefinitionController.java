package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/")
public class CohortDefinitionController {
	private final CohortDefinitionService cohortDefinitionService;

	public CohortDefinitionController(CohortDefinitionService cohortDefinitionService) {
		this.cohortDefinitionService = cohortDefinitionService;
	}

	// Return all cohort definition summaries.  Here no authorities are required.
	@GetMapping("/cohortdefinition/with_no_authorities")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionList() {
		var defs = cohortDefinitionService.getCohortDefinitionsWithNoAuthorities();
		var dtos = defs.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}

	// Return all cohort definition summaries.  The user is required to have
	// the "cohortreader" authority, which is set in the security/RegularSecurity class.
	@GetMapping("/cohortdefinition/require_cohortreader_authority_via_code")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionListRequireCohortReaderAuthorityViaCode() {
		var defs = cohortDefinitionService.getCohortDefinitionsWithCohortReaderAuthorityFromCode();

		var dtos = defs.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}

	// Return all cohort definition summaries.  Here a security annotation is used to
	// make sure that the user has the required "cohortreader" authority.  Note:
	// pre-authorize is the default and is enabled automatically.
	@GetMapping("/cohortdefinition/require_cohort_reader_authority_via_annotation")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionListRequireCohortReaderAuthorityViaAnnotation() {
		var defs = cohortDefinitionService.getCohortDefinitionsWithCohortReaderAuthorityFromAnnotation();

		var dtos = defs.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}
}
