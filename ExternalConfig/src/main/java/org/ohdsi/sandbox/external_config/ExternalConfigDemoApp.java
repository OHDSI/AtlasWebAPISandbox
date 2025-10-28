package org.ohdsi.sandbox.external_config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class ExternalConfigDemoApp extends SpringBootServletInitializer { 

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(ExternalConfigDemoApp.class);
	}	
	public static void main(String[] args) {
		SpringApplication.run(ExternalConfigDemoApp.class, args);
	}
}
