package org.ohdsi.sandbox.auth_windows;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * As of Tomcat 9+ , a servlet initializer is necessary for Servlet deployment.
*/
public class ServletInitializer extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(AuthWindowsApp.class);
	}

}
