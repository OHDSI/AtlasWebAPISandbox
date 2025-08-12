package org.ohdsi.sandbox.secdemo.usermanagement;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class PermissionsController {
    @PreAuthorize("hasAuthority('permission_creator')")
    @PostMapping("/permissions/create/{authority}")
    public String createUserPermission (String authority) {
        return "Created user permission " + authority;
    }

    @PreAuthorize("hasAuthority('permission_reader')")
    @GetMapping("/permissions")
    public String getUserPermissions () {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var username = auth.getName();
        var perms = "User " + username + " has permissions " + auth.getAuthorities();
        return perms;
    }
}
