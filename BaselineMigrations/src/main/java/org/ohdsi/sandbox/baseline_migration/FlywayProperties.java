package org.ohdsi.sandbox.baseline_migration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.datasource.flyway")
public class FlywayProperties {

    private DbConnectionProperties connection = new DbConnectionProperties();
    private String schema;
    private List<String> locations;
    private Map<String, String> placeholders = new HashMap<>();
 
    public DbConnectionProperties getConnection() {
        return connection;
    }

    public void setConnection(DbConnectionProperties connection) {
        this.connection = connection;
    }

    public String getSchema() {
        return schema;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }

    public List<String> getLocations() {
        return locations;
    }

    public void setLocations(List<String> locations) {
        this.locations = locations;
    }

    public Map<String, String> getPlaceholders() {
        return placeholders;
    }

    public void setPlaceholders(Map<String, String> placeholders) {
        this.placeholders = placeholders;
    }    
}
