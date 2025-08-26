package org.ohdsi.sandbox.cache;

import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

/**
 *
 * @author cknoll1
 */
public class ResourceHelper {

	public static String GetResourceAsString(String resource) {
		// Load the SQL file from the resources directory
		ClassPathResource cpResource = new ClassPathResource(resource);
		// Read the SQL file content into a String
		try {
			String content = StreamUtils.copyToString(cpResource.getInputStream(), StandardCharsets.UTF_8);
			return content;
		} catch (Exception e) {
			throw new RuntimeException("Resource not found: " + resource);
		}
	}
}
