package org.ohdsi.sandbox.WebAPIStarterDemo;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Optional;
import org.ohdsi.sandbox.pgembed.PGFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WebApiStarterDemoApplication {

	private static void initDB() {
		
		if ("true".equals(System.getProperty("sandbox.initalized"))) return;
		
		// for demo purposes, we will launch the embedded PG prior to launching the spring app
		PGFactory.Options options = new PGFactory.Options();
		options.port = Optional.of(15436);
		EmbeddedPostgres postgres = PGFactory.createEmbeddedPostgres(options);

		// set system params to init datasource beans from
		String url = "jdbc:postgresql://localhost:" + postgres.getPort() + "/postgres";
		System.setProperty("sandbox.url", url);
		System.setProperty("sandbox.username", "postgres");
		System.setProperty("sandbox.password", "");
		System.setProperty("sandbox.driver-class-name", "org.postgresql.Driver");
		System.setProperty("sandbox.initalized", "true");

		// create a default schema for this demo
		try (Connection conn = DriverManager.getConnection(url, "postgres", "postgres"); Statement stmt = conn.createStatement()) {
			stmt.execute("CREATE SCHEMA IF NOT EXISTS webapi_sandbox;");
			System.out.println("Schema webapi_sandbox created.");
		}
		catch (Exception e) {
			throw new RuntimeException("Failed to create webapi_sandbox schema", e);
		}
	}

	public static void main(String[] args) {
		initDB();
		SpringApplication.run(WebApiStarterDemoApplication.class, args);
	}
}
