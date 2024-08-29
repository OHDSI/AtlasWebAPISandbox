package org.ohdsi.sandbox.cache;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.cache.CacheManager;
import javax.cache.annotation.CacheResult;
import javax.cache.configuration.MutableConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.cache.JCacheManagerCustomizer;
import org.springframework.stereotype.Component;

/**
 *
 * @author GGIB
 */
@Component
public class UserService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UserService.class);

	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private UserService self;

	//create cache
	@Component
	public static class CachingSetup implements JCacheManagerCustomizer {

		public static final String USER_CACHE = "user";
		public static final String USER_LIST_CACHE = "userList";
		public static final String USER_PERM_CACHE = "userPermission";

		@Override
		public void customize(CacheManager cacheManager) {
			// Evict when a new user is updated
			cacheManager.createCache(USER_CACHE, new MutableConfiguration<String, UserDTO>()
				.setTypes(String.class, UserDTO.class)
				.setStoreByValue(false)
				.setStatisticsEnabled(true));
			// Evict when a new user is created or user is updated
			cacheManager.createCache(USER_LIST_CACHE, new MutableConfiguration<Object, List<UserDTO>>()
				.setTypes(Object.class, (Class<List<UserDTO>>) (Class<?>) List.class)
				.setStoreByValue(false)
				.setStatisticsEnabled(true));
			// Evict when role is modified, or User is modified
			cacheManager.createCache(USER_PERM_CACHE, new MutableConfiguration<String, Set<PermissionDTO>>()
				.setTypes(String.class, (Class<Set<PermissionDTO>>) (Class<?>) List.class)
				.setStoreByValue(false)
				.setStatisticsEnabled(true));
		}
	}

	@CacheResult(cacheName = CachingSetup.USER_CACHE)
	public UserDTO getUser(String login) {
		LOGGER.info("id " + login + " not found in cache. TimeStamp: {}", new Date());
		User user = userRepository
			.findByLogin(login)
			.orElseThrow(() -> new RuntimeException("User not found by login."));
		return new UserDTO(user.getId(), user.getName(), user.getLogin());
	}

	@CacheResult(cacheName = CachingSetup.USER_LIST_CACHE)
	public List<UserDTO> getUserList() {
		LOGGER.info("PersonList not found in cache. TimeStamp: {}", new Date());
		return userRepository.findAll()
			.stream().map(u -> new UserDTO(u.getId(), u.getName(), u.getLogin()))
			.collect(Collectors.toList());
	}
	
	@CacheResult(cacheName = CachingSetup.USER_PERM_CACHE)
	public List<PermissionDTO> getUserPermissions(String login) {
		LOGGER.info("User Permissions not found in cache. TimeStamp: {}", new Date());
		// this process will find the user, find each role, and create a list of unique
		// permission names to return to the caller
		User user = userRepository
			.findByLogin(login)
			.orElseThrow(() -> new RuntimeException("login not found when retrieving permissions"));

		Set<Permission> allPerms = new HashSet<>();
		user.getRoles().forEach((r) -> {
			allPerms.addAll(r.getPermissions());
		});
		List<PermissionDTO> permissions = allPerms.stream().map(p -> new PermissionDTO(p.getId(), p.getName()))
			.collect(Collectors.toList());
		return permissions;
	}
}
