package org.ohdsi.sandbox.auth_windows;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import waffle.spring.WindowsAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
public class WindowsController {

    @GetMapping("/windows/me")
    public String me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof WindowsAuthenticationToken token) {
            return "Logged in Windows user: " + token.getName();
        }
        return "No Windows user authenticated";
    }
}