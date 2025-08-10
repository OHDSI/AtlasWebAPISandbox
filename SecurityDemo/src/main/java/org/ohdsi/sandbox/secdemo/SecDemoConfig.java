package org.ohdsi.sandbox.secdemo;

import java.util.HashMap;
import java.util.Map;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/**
 * The main configuration for datasources and Flyway migration.
 * This demonstrates separate data sources since we want to enforce
 * different credentials for Flyway (create/admin tables) and the app.
 * 
 * @author cknoll1
 */
@Configuration
public class SecDemoConfig {

	@Bean
	public DataSource dataSource() {
		DriverManagerDataSource ds = new DriverManagerDataSource();
		ds.setDriverClassName(System.getProperty("sandbox.driver-class-name"));
		ds.setUrl(System.getProperty("sandbox.url"));
		ds.setUsername(System.getProperty("sandbox.username"));
		ds.setPassword(System.getProperty("sandbox.password"));
		return ds;
	}
}
