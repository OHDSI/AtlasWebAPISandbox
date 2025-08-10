package org.ohdsi.sandbox.secdemo;

import org.junit.jupiter.api.Test;
import org.ohdsi.sandbox.pgembed.EmbeddedPostgresExtension.WithEmbeddedPostgres;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = {EmbeddedPostgresTestConfig.class},
				properties = "spring.main.allow-bean-definition-overriding=true")
@WithEmbeddedPostgres(port = 15436)
class SecurityDemoApplicationTests {

	@Test
	void contextLoads() {
		// the actual test here is that the spring container launches
	}

}
