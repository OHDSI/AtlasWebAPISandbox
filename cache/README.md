## Caching Demmo

This project is demonstrating the use of Spring caching (JCache) to show how to configure cashes and handle cache puts and evicts, as well as fetchign cache statistics.

This project does not contain an 'application'. Rather, a series of tests were coded to execute Spring-managed components and services that will leverage `spring-data` and `spring-cache` functionality.


## Setup notes:
- Running on Spring Boot 1.5.22 (current WebAPI version)
- Using ehcache 3.9.11 (could not load 3.10.8 from maven)
- Created a simple repo of user/permision/role to run tests
- Used `application.properties` to configure the primary datasource as a H2 database, which auto-configures transaction managers.

## Implementation Details

### Cache configuration

This example is using out-of-the-box spring configuration where a CacheManager will be injected into the ApplicatinContext because ehcache is in the class path and `spring-starter-cache` is specified in the POM.  The cache defniitions are controlled by application properties `spring.cache.jcache.config=classpath:appCache.xml`,  which reads cache config from resource `appCache.xml`, located in the classpath.

Caching can be disabled when the value `spring.cache.type=none` is specified in application.properties.  We can control this via a maven property if necessary.

To create caches in a way that keeps it close to the service that uses it, an inner class that implements `JCacheManagerCustomizer` is defined that implements `customize(CacheManager cacheManager)` and sets up the caches that are needed for the service.   An example:
```
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
```

Notes: We will name the cache from a CONST, which can be referenced as `ServiceClass.CachingSetup.CACHE_NAME`.   The appCache.xml will need to have the associated caches configured in the xml (ie: use the `small-heap` template) but additional infomation (the key-value types) are set up when the cache is crated (via the `MutableConfiguration`).  It is possible that all of this could be configured in the XML, however, representing the types as in: `setTypes(Object.class, (Class<List<UserDTO>>) (Class<?>) List.class)` are not straight forward in XML syntax.

For reference, this is the appCache.xml:

```
<config
	xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
	xmlns='http://www.ehcache.org/v3'
	xmlns:jsr107='http://www.ehcache.org/v3/jsr107'>

	<service>
		<jsr107:defaults>
			<jsr107:cache name="user" template="small-heap"/>
			<jsr107:cache name="userList" template="small-heap"/>
			<jsr107:cache name="userPermission" template="small-heap"/>
		</jsr107:defaults>
	</service>

	<cache-template name="small-heap">
		<resources>
			<heap unit="entries">10</heap>
			<offheap unit="MB">1</offheap> <!-- unit of measure is case sensitive! -->
		</resources>
	</cache-template>
</config>
```

This config specifies 3 caches, `user`, `userList` and `userPermission` with the resource pools set up to use a small amount of heap space.   Additional caches would be defiend here and new templates would be introduced if additional cache resoruce config was necessasry.

Caching is applied by using the `@CacheResult` annotation on the service methods.  For example:

```
	@CacheResult(cacheName = CachingSetup.USER_CACHE)
	public UserDTO getUser(String login) {
		LOGGER.info("id " + login + " not found in cache. TimeStamp: {}", new Date());
		User user = userRepository
			.findByLogin(login)
			.orElseThrow(() -> new RuntimeException("User not found by login."));
		return new UserDTO(user.getId(), user.getName(), user.getLogin());
	}
```

This code will direct the CacheManager to fetch the UserDTO from `USER_CACHE`.  If it is not cached, it will run the function to fetch the value and insert into the cache.  If it is found, it returns immedately with the cached `UserDTO`.

### Disabling the Cache

To disable the cache, the spring framework provides an option to inject a 'no-op' cache manager.  To do this, use the following setting in `application.properties`:

```
spring.cache.type=none
```

However, in doing this, `CacheManager` beans will not be autoconfigured, and any `@Autowired` will fail, unless you declare them as `@Autowired(required=false)`, and then check for null before use.  This adds complexity to the code, but the alternative of creating a user-defined CacheManager bean that can either be the `JCacheManager` or `NoOpCacheManager` was difficult to implment (auto-configure was doing more than I could understand and make work).  This may be easier to accomplish after moving to Spring Boot 5.


### Repositories and Entities

One complication of caching is when to clear a cache due to a transient dependency of an entity.   For example, the `USER_LIST_CACHE` gets cleared when a user gets updated or removed.  The `USER_PERM_CACHE` gets invalided when 1) the user is modified (could be a user-role-assignment change), 2) a role gets updated (could be new role-permission change), 3) a permission changes (which could lead to a permission update for one of the roles that belongs to users).   

To test this behavior, a set of Repository, Entity and DTOs were produced for the following elements:
- User
- Role
- Permission

A Repository, Entity, and DTO were created for each of these in order to demonstrate making an underlying change that would lead to a cache eviction.

### EntityListeners

EntityListeners are used to respond to CRUD operations on entities (in this case, Users, Roles and Permissions).   EntityListners work slightly different from other DI concepts in Spring in that you register a listener class on the Entity using the `@EntityListeners` annotation as below:

```
@Entity
@EntityListeners(UserListener.class)
@Table(name = "sec_user")
public class User {
```

This means that there's no autowired @Bean definition that we can @Autowied to associate to an instance (this acts more like a stateless component).  Therefore in order to get the instance of the EntityListener (in this case: UserListener) we write it as follows:

```
@Component
public class UserListener {
	
	private static CacheManager cacheManager;
	
	@Autowired
	public void setCacheManager(CacheManager cacheManager) {
		this.cacheManager = cacheManager;
	}
	@PostUpdate
	@PostRemove
	void onRemoveOrUpdate(User user) {
		// when a user is removed or updated, we should clear cache of this user cache
		this.cacheManager.getCache(UserService.CachingSetup.USER_CACHE).remove(user.getLogin());
		this.cacheManager.getCache(UserService.CachingSetup.USER_LIST_CACHE).removeAll();
		this.cacheManager.getCache(UserService.CachingSetup.USER_PERM_CACHE).remove(user.getLogin());
	}

}

```

This allows the configured `CacheManager` to be properly injected into the UserListener instance so that we can clear caches.

### Test Cases

#### CacheTest

This test class has 3 main use-cases:
- Cache user lookup: ensure cache is hit when you do a second lookup of a user
- Cache user list: ensure user list cache is hit when you get the list of all users
- Test cache configuration: Ensure reading cache configuration from appCache.xml is honored.

#### RepositoryCacheTest

This test chass as 2 main use-cases:
- When a user is modified, user, userList and userPermission caches should be cleared
- When a role is modified, the user permission cache chould be cleared

## Summary

This repository demonstrates how we can implment a caching layer into WebAPI, and shows how changes to transient dependencies of cached information can be caught and evicted from cache.


