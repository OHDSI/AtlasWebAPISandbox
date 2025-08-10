package org.ohdsi.sandbox.secdemo.domain;

import org.springframework.util.StringUtils;

public class UserDomain {
    public UserDomain() {}

    public UserDomain(Long id, String username) {
        setId(id);
        setUsername(username);
    }

    private Long id;
    private String username;

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        if (id == null || id < 0) {
            throw new IllegalArgumentException("Invalid id: " + id);
        }
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        if (StringUtils.hasText(username)) {
            this.username = username;
            return;
        }

        throw new IllegalArgumentException("Username cannot be null or blank");
    }
}
