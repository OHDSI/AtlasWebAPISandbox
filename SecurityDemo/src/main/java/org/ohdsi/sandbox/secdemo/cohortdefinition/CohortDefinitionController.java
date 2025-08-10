package org.ohdsi.sandbox.secdemo.cohortdefinition;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class CohortDefinitionController {
	@GetMapping("/echo")
	public String echo(String message) {
		return "echo: " + message;
	}
}
