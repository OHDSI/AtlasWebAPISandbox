package org.ohdsi.sandbox.cache;

import java.io.Serializable;

/**
 *
 * @author cknoll1
 */
public class UserDTO implements Serializable{
	public UserDTO(int id, String name, String login) {
		this.id = id;
		this.name = name;
		this.login=login;
	}
	public int id;
	public String name;
	public String login;
}
