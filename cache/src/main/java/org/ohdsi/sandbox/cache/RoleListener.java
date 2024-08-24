/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package org.ohdsi.sandbox.cache;

import javax.cache.CacheManager;
import javax.persistence.PostRemove;
import javax.persistence.PostUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author cknoll1
 */
@Component
public class RoleListener {
	
	private static CacheManager cacheManager;
	
	@Autowired(required=false)
	public void setCacheManager(CacheManager cacheManager) {
		this.cacheManager = cacheManager;
	}

	@PostUpdate
	@PostRemove
	void onRemoveOrUpdate(Role role) {
		if (cacheManager == null) return; // cache may be disabled
		// When roles are removed or updated, user permissions are evicted.
		this.cacheManager.getCache(UserService.CachingSetup.USER_PERM_CACHE).clear();
	}
	
}
