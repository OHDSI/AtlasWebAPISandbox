package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.ohdsi.sandbox.secdemo.cohortdefinition.converter.CohortDefinitionDomainToCohortDefinitionSummaryDTO;
import org.ohdsi.sandbox.secdemo.cohortdefinition.dto.CohortDefinitionSummaryDTO;
import org.ohdsi.sandbox.secdemo.domain.CohortDefinitionDomain;
import org.ohdsi.sandbox.secdemo.domain.ExpressionType;
import org.ohdsi.sandbox.secdemo.domain.UserDomain;
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
		// TODO get defs
		var defs = new ArrayList<CohortDefinitionDomain>();
		var d = new CohortDefinitionDomain(
				1L,
				"Cohort1",
				"C1 description",
				ExpressionType.SIMPLE_EXPRESSION,
				new UserDomain(47L, "fred flintstone"));
		defs.add(d);

		var dtos = defs.stream()
				.map(CohortDefinitionDomainToCohortDefinitionSummaryDTO::convert).toList();
		return dtos;
	}
}
