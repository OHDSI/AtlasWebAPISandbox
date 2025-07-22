package org.ohdsi.sandbox.pgembed;

import com.opentable.db.postgres.embedded.EmbeddedPostgres;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;


/**
 * Creates an Embedded postgres instance via a static initializer.
 * 
 * Sets the following System properties: 
 *		sandbox.url, sandbox.username, sandbox.password, sandbox.drive-class-name
 * 
 * Creates the schema: webapi_sandbox by default.  
 * 
 * Do not reference this directly in Spring components!  On hot reload, will trigger another
 * static instance which will create another load of the PG server.  Instead, create a DataSource
 * that reads settings from System.getProperty() to initialize the data source.
 * 
 * Also creates a JDK shutdown hook to clean up the PG instance.  Note:  force-killing
 * the JVM (such as through stopping debug session) may leave the PG instance running 
 * which you will need to kill manually through PID.
 * 
 * @author cknoll1
 */
public class PgHolder {

	private static final EmbeddedPostgres postgres;

	static {
		try {
			postgres = EmbeddedPostgres.builder()
							.setPort(15436) // 0 = choose a random free port
							.start();

			// Set system properties for Spring Boot to pick up
			String url = "jdbc:postgresql://localhost:" + postgres.getPort() + "/postgres";
			System.setProperty("sandbox.url", url);
			System.setProperty("sandbox.username", "postgres");
			System.setProperty("sandbox.password", "");
			System.setProperty("sandbox.driver-class-name", "org.postgresql.Driver");

			Runtime.getRuntime().addShutdownHook(new Thread(() -> {
				try {
					postgres.close();
					System.out.println("Embedded Postgres shut down.");
				} catch (IOException e) {
					e.printStackTrace();
				}
			}));

			// Run schema creation with raw JDBC
			try (Connection conn = DriverManager.getConnection(url, "postgres", "postgres");
					 Statement stmt = conn.createStatement()) {
					stmt.execute("CREATE SCHEMA IF NOT EXISTS webapi_sandbox;");
					System.out.println("Schema webapi_sandbox created.");
			}			

		} catch (Exception e) {
			throw new RuntimeException("Failed to start Embedded Postgres", e);
		}
	}

	public static EmbeddedPostgres getPostgres() {
		return postgres;
	}

}
