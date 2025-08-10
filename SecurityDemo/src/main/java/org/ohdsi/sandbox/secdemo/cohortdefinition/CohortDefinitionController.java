package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cohortdefinition")
public class CohortDefinitionController {
	@GetMapping("/")
	public String echo(String message) {
		return "echo: " + message;
	}
}
