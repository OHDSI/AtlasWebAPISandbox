package org.ohdsi.sandbox.secdemo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;

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
