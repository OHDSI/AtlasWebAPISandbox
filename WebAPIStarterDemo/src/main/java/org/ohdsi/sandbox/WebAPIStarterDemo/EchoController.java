package org.ohdsi.sandbox.WebAPIStarterDemo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * A simple controller that echos back the 'message' parameter.
 * 
 * @author cknoll1
 */
@RestController
@RequestMapping("/")
public class EchoController {

	@GetMapping("/echo")
	public String echo(String message) {
		return "echo: " + message;
	}
}
