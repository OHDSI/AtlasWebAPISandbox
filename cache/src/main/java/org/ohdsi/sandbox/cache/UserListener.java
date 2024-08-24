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
public class UserListener {
	
	private static CacheManager cacheManager;
	
	@Autowired(required = false)
	public void setCacheManager(CacheManager cacheManager) {
		this.cacheManager = cacheManager;
	}

	@PostUpdate
	@PostRemove
	void onRemoveOrUpdate(User user) {
		if (cacheManager == null) return; // cache could be disabled
		
		// when a user is removed or updated, we should clear cache of this user cache
		this.cacheManager.getCache(UserService.CachingSetup.USER_CACHE).remove(user.getLogin());
		this.cacheManager.getCache(UserService.CachingSetup.USER_LIST_CACHE).clear();
		this.cacheManager.getCache(UserService.CachingSetup.USER_PERM_CACHE).remove(user.getLogin());
	}
	
}
