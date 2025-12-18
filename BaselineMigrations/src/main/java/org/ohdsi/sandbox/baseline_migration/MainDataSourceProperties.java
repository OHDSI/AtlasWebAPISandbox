package org.ohdsi.sandbox.baseline_migration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.datasource.main")
public class MainDataSourceProperties {

    private DbConnectionProperties connection = new DbConnectionProperties();

    public DbConnectionProperties getConnection() {
        return connection;
    }

    public void setConnection(DbConnectionProperties connection) {
        this.connection = connection;
    }
}
