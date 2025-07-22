package org.ohdsi.sandbox.WebAPIStarterDemo;

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
public class WebAPIStarterConfig {

	@Bean
	public DataSource dataSource() {
		DriverManagerDataSource ds = new DriverManagerDataSource();
		ds.setDriverClassName(System.getProperty("sandbox.driver-class-name"));
		ds.setUrl(System.getProperty("sandbox.url"));
		ds.setUsername(System.getProperty("sandbox.username"));
		ds.setPassword(System.getProperty("sandbox.password"));
		return ds;
	}

	@Bean(name = "flywayDataSource")
	public DataSource flywayDataSource() {
		return dataSource();
	}

	@Bean(initMethod = "migrate")
	public Flyway flyway(@Qualifier("flywayDataSource") DataSource dataSource) {

		Map<String, String> placeholders = new HashMap<>();
		placeholders.put("schemaName", "webapi_sandbox");

		return Flyway.configure()
						.schemas("webapi_sandbox")
						.placeholders(placeholders)
						.locations("classpath:db/migration")
						.dataSource(dataSource)
						.load();
	}

	@Bean
	public ExitCodeGenerator exitCodeGenerator() {
		return () -> {
			System.out.println(">>> ExitCodeGenerator triggered");
			return 0;
		};
	}
}
