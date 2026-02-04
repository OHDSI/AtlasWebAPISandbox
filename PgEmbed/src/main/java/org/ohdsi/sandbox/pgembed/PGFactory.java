/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package org.ohdsi.sandbox.pgembed;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

/**
 *
 * @author cknoll1
 */
public abstract class PGFactory {

	public static class Options {
		public Optional<Integer> port = Optional.empty();
		public Optional<Integer> timeoutSeconds = Optional.empty();
	}

	public static EmbeddedPostgres createEmbeddedPostgres(Options options) {
		final EmbeddedPostgres postgres;
		try {
			int port = options.port.orElse(0);
			int startupWait = options.timeoutSeconds.orElse(30);
			postgres = EmbeddedPostgres.builder()
				.setPGStartupWait(Duration.ofSeconds(30))
				.setPort(port) // 0 = choose a random free port
							.setPGStartupWait(Duration.ofSeconds(startupWait)) 
				.start();
		} catch (Exception e) {
			throw new RuntimeException("Failed to start Embedded Postgres", e);
		}

		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			try {
				postgres.close();
				System.out.println("Embedded Postgres shut down.");
			} catch (IOException e) {
				e.printStackTrace();
			}
		}));
		
		return postgres;
	}

}
