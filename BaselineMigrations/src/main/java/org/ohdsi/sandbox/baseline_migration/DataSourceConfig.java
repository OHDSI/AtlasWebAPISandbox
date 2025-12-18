package org.ohdsi.sandbox.baseline_migration;

import java.util.List;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

@Configuration
@EnableConfigurationProperties({
        MainDataSourceProperties.class,
        FlywayProperties.class
})
public class DataSourceConfig {

    @Bean
    @Qualifier("mainDataSource")
    public DataSource mainDataSource(MainDataSourceProperties props) {
        return createDataSource(props.getConnection());
    }

    @Bean
    @Qualifier("flywayDataSource")
    public DataSource flywayDataSource(FlywayProperties props) {
        return createDataSource(props.getConnection());
    }

@Bean(initMethod = "migrate")
public Flyway flyway(
        @Qualifier("flywayDataSource") DataSource flywayDataSource,
        FlywayProperties props) {

    // Get locations and schemas, provide defaults if null
    List<String> locations = props.getLocations();
    if (locations == null || locations.isEmpty()) {
        locations = List.of("classpath:db/migration");
    }

    return Flyway.configure()
            .dataSource(flywayDataSource)
            .schemas(props.getSchema())
            .locations(locations.toArray(new String[0]))      // convert List<String> -> String[]
            .placeholders(props.getPlaceholders())            // already a Map<String,String>, safe
            .baselineOnMigrate(true)
            .validateMigrationNaming(true)
            .load();
}

    private DataSource createDataSource(DbConnectionProperties props) {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setUrl(props.getUrl());
        ds.setUsername(props.getUsername());
        ds.setPassword(props.getPassword());
        ds.setDriverClassName(props.getDriverClassName());
        return ds;
    }
}
