package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/")
public class CohortDefinitionController {
	// Return all cohort definition summaries
	@GetMapping("/cohortdefinition")
	public List<CohortDefinitionSummaryDTO> getCohortDefinitionList() {
		// Fake up one cohort definition
		var defs = new ArrayList<CohortDefinition>();
		var d = new CohortDefinition(
				1L,
				"Cohort1",
				"C1 description",
				ExpressionType.SIMPLE_EXPRESSION,
				new SecUser(47L, "fred flintstone"));
		defs.add(d);

		// Convert the cohortdefinition list to a list of summary DTOs, return to user.
		var dtos = defs.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}
}
