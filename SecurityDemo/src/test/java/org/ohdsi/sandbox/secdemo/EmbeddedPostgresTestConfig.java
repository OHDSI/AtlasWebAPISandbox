package org.ohdsi.sandbox.secdemo;

import com.opentable.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.SimpleDriverDataSource;

import javax.sql.DataSource;
import org.ohdsi.sandbox.pgembed.EmbeddedPostgresExtension;

@TestConfiguration
public class EmbeddedPostgresTestConfig {

    @Bean
    public EmbeddedPostgres embeddedPostgres() {
        return EmbeddedPostgresExtension.getInstance();
    }

    @Bean
    public DataSource dataSource(EmbeddedPostgres pg) {
        return new SimpleDriverDataSource(
            new org.postgresql.Driver(),
            pg.getJdbcUrl("postgres", "postgres"),
            "postgres",
            "postgres"
        );
    }

    @Bean(name = "flywayDataSource")
    public DataSource flywayDataSource(EmbeddedPostgres pg) {
        return dataSource(pg); // reuse same
    }
}
