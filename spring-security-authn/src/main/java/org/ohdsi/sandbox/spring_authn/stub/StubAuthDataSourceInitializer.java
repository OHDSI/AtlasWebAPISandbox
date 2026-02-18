package org.ohdsi.sandbox.spring_authn.stub;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import jakarta.annotation.PostConstruct;

@Configuration
public class StubAuthDataSourceInitializer {

  private final DataSource authDataSource;
  private final JdbcTemplate jdbc;

  public StubAuthDataSourceInitializer(@Qualifier("authDataSource") DataSource authDataSource) {

    this.authDataSource = authDataSource;
    this.jdbc = new JdbcTemplate(authDataSource);
  }

  @PostConstruct
  public void initSchemaAndUsers() {

    // create schema
    ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
    populator.addScript(new ClassPathResource("stub/auth-schema.sql"));
    // insert users
    populator.addScript(new ClassPathResource("stub/auth-data.sql"));    
    populator.execute(authDataSource);

  }
}
