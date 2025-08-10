package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.ohdsi.sandbox.secdemo.cohortdefinition.converter.CohortDefinitionDomainToCohortDefinitionMetadataDTO;
import org.ohdsi.sandbox.secdemo.cohortdefinition.dto.CohortDefinitionMetadataDTO;
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
	// Return a list of metadata about all cohort definitions
	@GetMapping("/cohortdefinition")
	public List<CohortDefinitionMetadataDTO> getCohortDefinitionList() {
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
				.map(CohortDefinitionDomainToCohortDefinitionMetadataDTO::convert).toList();
		return dtos;
	}
}
