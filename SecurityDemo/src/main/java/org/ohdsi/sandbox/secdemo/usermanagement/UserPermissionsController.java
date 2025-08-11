package org.ohdsi.sandbox.secdemo.usermanagement;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class UserPermissionsController {
    @GetMapping("/userpermissions")
    public String getUserPermissions () {
        return "Here are your user permissions";
    }
}
