package org.ohdsi.sandbox.actdemo.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {
	@GetMapping("/demo")
	public String getDemo() {
		return "Demo Endpoint - Does Nothing";
	}
}
