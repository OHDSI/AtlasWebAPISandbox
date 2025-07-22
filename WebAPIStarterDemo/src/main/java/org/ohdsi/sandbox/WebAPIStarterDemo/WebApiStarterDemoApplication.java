package org.ohdsi.sandbox.WebAPIStarterDemo;

import org.ohdsi.sandbox.pgembed.PgHolder;
import com.opentable.db.postgres.embedded.EmbeddedPostgres;
import java.security.Permission;
import java.util.Arrays;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WebApiStarterDemoApplication {

	private static void debugExitSetup() {
		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			System.out.println(">>> JVM Shutdown Hook Triggered");

			System.out.println(">>> Capturing thread dump:");
			Thread.getAllStackTraces().forEach((t, s) -> {
				System.out.println("Thread: " + t.getName());
				for (StackTraceElement ste : s) {
					System.out.println("  at " + ste);
				}
			});

			System.out.println(">>> JVM is shutting down. Check for System.exit() or fatal exceptions.");
		}));

	}

	public static void main(String[] args) {
		//debugExitSetup();
		// for demo purposes, we will launch the embedded PG prior to launching the spring app
		EmbeddedPostgres pg = PgHolder.getPostgres(); // this will init PG outside of spring reloaded class loader

		SpringApplication.run(WebApiStarterDemoApplication.class, args);
	}
}