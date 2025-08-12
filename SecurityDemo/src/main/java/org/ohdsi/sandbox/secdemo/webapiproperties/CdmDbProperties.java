package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.NotBlank;

public class CdmDbProperties {
    @NotBlank(message = "webapi.cdm-db.dialect must have a value")
    private String dialect;

    @NotBlank(message = "webapi.cdm-db.jdbc-template-suppress-api-exceptions must have a value")
    private Boolean jdbcTemplateSuppressApiExceptions;

    @NotBlank(message = "webapi.cdm-db.name must have a value")
    private String name;

    @NotBlank(message = "webapi.cdm-db.version must have a value")
    private String version;

    public String getDialect() {return dialect;}
    public String dialect() {return dialect;}
    public void setDialect(String dialect) {this.dialect = dialect;}

    public Boolean getJdbcTemplateSuppressApiExceptions() {return jdbcTemplateSuppressApiExceptions;}
    public void setJdbcTemplateSuppressApiExceptions(Boolean jdbcTemplateSuppressApiExceptions) {this.jdbcTemplateSuppressApiExceptions = jdbcTemplateSuppressApiExceptions;}
    public Boolean jdbcTemplateSuppressApiExceptions() {return jdbcTemplateSuppressApiExceptions;}

    public String getName() {return name;}
    public String name() {return name;}
    public void setName(String name) {this.name = name;}

    public String getVersion() {return version;}
    public String version() {return version;}
    public void setVersion(String version) {this.version = version;}
}


