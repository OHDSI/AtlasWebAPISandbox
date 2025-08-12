package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.NotBlank;

public class AuthDbProperties {
    @NotBlank(message = "auth-db.authentication-query cannot be blank")
    private String authenticationQuery;
    
    @NotBlank(message = "auth-db.dialect cannot be blank")
    private String dialect;

    @NotBlank(message = "auth-db.driver-class-name cannot be blank")
    private String driverClassName;

    @NotBlank(message = "auth-db.password cannot be blank")
    private String password;

    @NotBlank(message = "auth-db.schemaName cannot be blank")
    private String schemaName;

    // Ideally we could create a custom "JDBC URL" annotation.  The stock
    // URL validator (from Hibernate) will not work because it can't handle
    // the leading jdbc: stuff.
    @NotBlank(message = "auth-db.url cannot be blank")
    private String url;

    @NotBlank(message = "auth-db.username cannot be blank")
    private String username;

    public String getAuthenticationQuery() {
        return authenticationQuery;
    }
    public String authenticationQuery() {
        return authenticationQuery;
    }
    public void setAuthenticationQuery(String authenticationQuery) {
        this.authenticationQuery = authenticationQuery;
    }
    
    public String getDialect() {
        return dialect;
    }
    public String dialect() {
        return dialect;
    }
    public void setDialect(String dialect) {
        this.dialect = dialect;
    }

    public String getDriverClassName() {
        return driverClassName;
    }
    public String driverClassName() {
        return driverClassName;
    }
    public void setDriverClassName(String driverClassName) {
        this.driverClassName = driverClassName;
    }

    public String getPassword() {
        return password;
    }
    public String password() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getSchemaName() {
        return schemaName;
    }
    public String schemaName() {
        return schemaName;
    }
    public void setSchemaName(String schemaName) {
        this.schemaName = schemaName;
    }

    public String getUrl() {
        return url;
    }
    public String url() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }

    public String getUsername() {
        return username;
    }
    public String username() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
}