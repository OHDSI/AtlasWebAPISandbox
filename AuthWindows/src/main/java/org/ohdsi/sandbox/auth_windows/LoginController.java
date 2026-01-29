package org.ohdsi.sandbox.auth_windows;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * The LoginController class groups the different auth controller endpoints, and we do it with inner classes
 * so that we don't have an explosion of classes in the code tree for 1 controller per auth.  The class is required in order to
 * apply @ConditionalOnProperty annotations.
 * 
 * There may be a concern with the class names and how they would unwind into something like swagger, and that may need to be investigated, but
 * the theory is that the swagger method will be LoginController$Windows.login.  All the other controllers will be prefixed with LoginController$
 * 
*/
public class LoginController {

    /**
     * Windows Authentication controller which responds with JWT and login results.
    */
    @RestController
    @ConditionalOnProperty(prefix = "security.auth.windows", name = "enabled", havingValue = "true")
    public static class Windows {
        private final LoginService loginSvc;

        public Windows(LoginService loginSvc) {
            this.loginSvc = loginSvc;
        }

        @GetMapping("/user/login/windows")
        public LoginService.Result login(Authentication authentication) {
            return loginSvc.onSuccess(authentication);
        }        
    }

    /**
     * Database Authentication controller which responds with JWT and login results.
    */
    @RestController
    @ConditionalOnProperty(prefix = "security.auth.db", name = "enabled", havingValue = "true")
    public static class Database {
        private final LoginService loginSvc;

        public Database(LoginService loginSvc) {
            this.loginSvc = loginSvc;
        }

        @PostMapping("/user/login/db")
        public LoginService.Result login(Authentication authentication) {
            return loginSvc.onSuccess(authentication);
        }        
    }    

}
