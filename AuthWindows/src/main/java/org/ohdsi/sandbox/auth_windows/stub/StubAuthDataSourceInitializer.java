package org.ohdsi.sandbox.auth_windows.stub;

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
    populator.execute(authDataSource);

    // insert users
    jdbc.update("""
        INSERT INTO auth_user
        (username, password_hash, enabled, failed_attempts)
        VALUES (?, ?, true, 0)
        """,
        "alice", "{noop}password1");

    jdbc.update("""
        INSERT INTO auth_user
        (username, password_hash, enabled, failed_attempts)
        VALUES (?, ?, true, 0)
        """,
        "bob", "{noop}password2");
  }
}
