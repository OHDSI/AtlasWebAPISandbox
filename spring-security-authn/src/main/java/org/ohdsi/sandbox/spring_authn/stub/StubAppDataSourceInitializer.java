package org.ohdsi.sandbox.spring_authn.stub;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import jakarta.annotation.PostConstruct;

@Configuration
public class StubAppDataSourceInitializer {

    private final JdbcTemplate jdbc;

    public StubAppDataSourceInitializer(@Qualifier("appDataSource") DataSource appDataSource) {
        this.jdbc = new JdbcTemplate(appDataSource);
    }

    @PostConstruct
    public void init() {

        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("stub/app-schema.sql"));
        populator.execute(jdbc.getDataSource());
    }
}