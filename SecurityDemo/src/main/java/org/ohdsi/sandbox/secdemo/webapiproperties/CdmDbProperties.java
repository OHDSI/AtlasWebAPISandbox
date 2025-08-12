package org.ohdsi.sandbox.secdemo.webapiproperties;

public class CdmDbProperties {
    private String dialect;

    private Boolean jdbcTemplateSuppressApiExceptions;

    private String name;

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


