package org.ohdsi.sandbox.cache;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.management.CacheStatisticsMXBean;
import javax.transaction.Transactional;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = CacheDemo.class)
public class RepositoryCacheTest {

	@Autowired
	private UserService userService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private PermissionRepository permissionRepository;

	@Autowired
	private CacheManager cacheManager	;

	@Autowired
	private JdbcTemplate jdbcTemplate;
	
	@Before
	public void setUp() {
		// init db for this test
		// Load the SQL file from the resources directory
		// this contains 3 users, 3 permissions, 3 roles, none assigned.
		String dataSql = ResourceHelper.GetResourceAsString("repositorycache_data.sql");
		jdbcTemplate.execute(dataSql);
		this.assignDefaultPermissions();
	}
	
	public void assignDefaultPermissions() {
		// assigning some permissions to roles
		List<Role> allRoles = roleRepository.findAll();
		List<Permission> allPerms = permissionRepository.findAll();

		// we'll establish that role[0] has no perms, role[1] has permission[0] and role[2] has permission[1..2]
		Role targetRole;
		targetRole = allRoles.get(1);
		targetRole.setPermissions(new HashSet(Arrays.asList(allPerms.get(0))));
		roleRepository.save(targetRole);
		targetRole = allRoles.get(2);
		targetRole.setPermissions(new HashSet(Arrays.asList(allPerms.get(1), allPerms.get(2))));
		roleRepository.save(targetRole);		
	}
	
	@Test
	@Transactional
	public void testPermissionService() throws Exception {
		Cache permCache = cacheManager	.getCache(UserService.CachingSetup.USER_PERM_CACHE);
		// Ensure cache is empty
		CacheStatisticsMXBean cacheStatistics = CacheHelper.getCacheStats(cacheManager, UserService.CachingSetup.USER_PERM_CACHE);
		permCache.clear();
		cacheStatistics.clear();
		int testHits = 0;
		int testMisses = 0;
		
		List<PermissionDTO> perms;
		perms = userService.getUserPermissions("user1");
		testMisses++; // the cache lookup should miss
		assertThat(perms.size()).isEqualTo(0);
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(testHits); 
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(testMisses); 
		
		// modify a user to add a role
		User user = userRepository.findByLogin("user1").orElseThrow(RuntimeException::new);
		List<Role> roles = roleRepository.findAll();
		// assign the user role[2]
		user.setRoles(new HashSet(Arrays.asList(roles.get(2))));
		userRepository.saveAndFlush(user);
		
		perms = userService.getUserPermissions("user1");
		testMisses++; // the cache lookup should miss
		assertThat(perms.size()).isEqualTo(2); // role[2] has two roles.
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(testHits); 
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(testMisses); 
		
	}
	@Test
	@Transactional
	public void testRoleChange() throws Exception {
		Cache permCache = cacheManager	.getCache(UserService.CachingSetup.USER_PERM_CACHE);
		// Ensure cache is empty
		CacheStatisticsMXBean cacheStatistics = CacheHelper.getCacheStats(cacheManager, UserService.CachingSetup.USER_PERM_CACHE);
		permCache.clear();
		cacheStatistics.clear();
		int testHits = 0;
		int testMisses = 0;

		// for this test, we're going to alter role[0] to contain all permissions
		Role role = roleRepository.findAll().get(0);
		List<Permission> allPerms = permissionRepository.findAll();
		
		List<PermissionDTO> userPerms;
		userPerms = userService.getUserPermissions("user1");
		testMisses++; // the cache lookup should miss
		userPerms = userService.getUserPermissions("user1");
		testHits++; // the cache lookup should hit
		
		role.setPermissions(new HashSet<>(allPerms));
		roleRepository.saveAndFlush(role);
		
		userPerms = userService.getUserPermissions("user1");
		testMisses++; // the cache lookup should miss
		
		assertThat(cacheStatistics.getCacheHits()).isEqualTo(testHits); 
		assertThat(cacheStatistics.getCacheMisses()).isEqualTo(testMisses); 
	}
}
