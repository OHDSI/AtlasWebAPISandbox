package org.ohdsi.sandbox.cache;

import javax.cache.CacheManager;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = CacheDemo.class)
@TestPropertySource(properties = {
	"spring.cache.type=none",
	"spring.datasource.url=jdbc:h2:mem:noCache;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
public class NoCacheTest {
	@Autowired(required=false)
	private CacheManager cacheManager	;

	@Autowired
	private UserService userService;

	@Test
	public void testNoCacheConfig() throws Exception {
		assertThat(cacheManager).isNull();
		
		// even with no cache manager, we should be able to query for users
		userService.getUserList();
	}
	
}
