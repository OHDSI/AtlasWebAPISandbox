package org.ohdsi.sandbox.cache;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.cache.CacheManager;
import javax.cache.management.CacheStatisticsMXBean;
import static org.assertj.core.api.Assertions.assertThat;
import org.ehcache.config.CacheRuntimeConfiguration;
import org.ehcache.config.ResourceType;
import org.ehcache.jsr107.Eh107Configuration;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = CacheDemo.class)
public class CacheTest {

	@Autowired
	private UserService userService;

	@Autowired
	private CacheManager cacheManager	;

	@Autowired
	private JdbcTemplate jdbcTemplate;
			
	private javax.cache.Cache<Integer, UserDTO> userCache;
	private javax.cache.Cache<Object, List<UserDTO>> userListCache;

	@Before
	public void setUp() {
		// this is to handle when spring.cache.type=none
		if (cacheManager != null) {
			userCache = cacheManager	.getCache("user");
			userListCache = cacheManager	.getCache("userList");
		}
		// init db for this test
		// Load the SQL file from the resources directory
		String dataSql = ResourceHelper.GetResourceAsString("cachetest_data.sql");
		jdbcTemplate.execute(dataSql);

	}

	@Test
	public void testUserCache() throws Exception {

		UserDTO user;
		// Ensure cache is empty
		CacheStatisticsMXBean cacheStatistics = CacheHelper.getCacheStats(cacheManager , "user");
		userCache.clear();
		cacheStatistics.clear();

		// Call the service method and check cache miss
		user = userService.getUser("user1");
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(1);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(0);

		// Call the service method again and check cache hit
		userService.getUser("user1");
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(1);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(1);
		
		// reset statistics and query again, but should have 0 misses
		cacheStatistics.clear();
		userService.getUser("user1");
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(0);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(1);
		
	}
	
	@Test
	public void testUserListCache() throws Exception {

		// Ensure cache is empty
		CacheStatisticsMXBean cacheStatistics = CacheHelper.getCacheStats(cacheManager	, "userList");
		userListCache.clear();
		cacheStatistics.clear();

		// Call the service method and check cache miss
		userService.getUserList(); // not in cache, so cache is missed
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(1);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(0);

		// Call the service method again and check cache hit
		userService.getUserList(); // in cache, so cache is a hit
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(1);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(1);
		
		// reset statistics and query again, but should have 0 misses
		cacheStatistics.clear();
		userService.getUserList(); // in cache, so cache is a hit
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(0);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(1);
	}

	@Test
	public void testGetCacheConfig() throws Exception {
		CacheRuntimeConfiguration<String, UserDTO> ehcacheConfig = (CacheRuntimeConfiguration<String, UserDTO>) userCache
			.getConfiguration(Eh107Configuration.class).unwrap(CacheRuntimeConfiguration.class);
		assertThat(ehcacheConfig.getResourcePools().getPoolForResource(ResourceType.Core.HEAP).getSize()).isEqualTo(10);
	}
	
}
