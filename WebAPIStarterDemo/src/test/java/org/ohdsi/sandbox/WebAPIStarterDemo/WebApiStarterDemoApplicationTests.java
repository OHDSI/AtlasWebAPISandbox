package org.ohdsi.sandbox.WebAPIStarterDemo;

import com.opentable.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.Test;
import org.ohdsi.sandbox.pgembed.PgHolder;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class WebApiStarterDemoApplicationTests {
	static {
		EmbeddedPostgres pg = PgHolder.getPostgres(); // this will init PG outside of spring reloaded class loader
	}
	
	@Test
	void contextLoads() {
	}

}
