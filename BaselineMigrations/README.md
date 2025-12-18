# Baseline Migration Demo

For WebAPI 3.0, we'd like to be able to make fresh installations jump directly to the V3.0 schema without going through the previous migration steps.

This Sandbox Project demonstrates how migrations work with new/existing databases and different states of migration scripts.

# How Flyway Works

Flyway will execute migration scripts in order (Numeric, following version semantics ie: 1.1.0 -> 1.1.1 -> 1.2.0-> 1.2.1 -> 1.3.0).  To perform this action, it uses the following steps:

1. Flyway scans all `locations` (which can reference a filesystem or class path location) to determine what migrations exist.
2. Flyway determines if this is a clean install (an empty target schema) or if the schema exists.
3. If it is an existing schema with a schema history table, it determines which migrtaions need to be executed to bring it up to date.
4. If it is a new schema, the latest `baseline` script (prefixed with `B`) is executed to bring the schema up to that version, and any subsequent `V` scripts are executed to complete the migration.

# Migrating from 2.x to 3.x

The 2.15 release contains 10+ years of migration scripts, so baseline migrations would work well here for parties that are installing a fresh installation of WebAPI 3.0.  We want to perform some DB cleanup going from 2.15 to 3.0, and possibly restructure the database.  For those operations, a 2.15 -> 3.0 `V` script will be created.   For new Installations, a `B` baseline script will initlize the database to an initial 3.0 schema.

# What's in this Sandbox

This project contains 2 sets of migration scripts,found under `db/migration` and `db/migration_v2`.   The `/migration` folder contains a series of migrations to bring the schema to V1.3, and then migration_v2 contains migrations for a V2.0 release and a V3.1 release.v3.0 (`B3.0__baseline.sql`) and a baseline migration for the V3.0 release.   

To experience this demo properly, you should create an empty database in postgres and update `application.yaml` to point to your local PG instance and user/passwords as needed.  You will use the following `application.yaml` in this example, and make modifications to check the expected result.

Application.yaml:

```
app:
  main-schema: migration_test
  datasource:
    main:
      connection:
        url: jdbc:postgresql://localhost:5436/MIGRATION_DEMO
        username: ohdsi_app_user
        password: app1
        driver-class-name: org.postgresql.Driver

    flyway:
      connection:
        url: ${app.datasource.main.connection.url}
        username: ohdsi_admin_user
        password: admin1
        driver-class-name: ${app.datasource.main.connection.driver-class-name}
      schema: ${app.main-schema}
      locations_1: [classpath:db/migration]
      locations_2: [classpath:db/migration,classpath:db/migration_v2]
      locations: [classpath:db/migration]
      placeholders:
        schemaName: ${app.main-schema}
```

You will use the values from `locations_1` or `locations_2` depending on which step you are in the demo.   To run the demo:

### Showing an Existing database with migration

1. Update application.yaml with the correct PG credentials and JDBC url
2. Set the `location` property to the value found in `locations_1`.  
3. Run the App.  You will see output like:

```
2025-12-17T21:57:05.179-05:00  INFO 10904 --- [           main] o.f.c.i.s.JdbcTableSchemaHistory         : Schema history table "migration_test"."flyway_schema_history" does not exist yet
2025-12-17T21:57:05.182-05:00  INFO 10904 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 3 migrations (execution time 00:00.027s)
2025-12-17T21:57:05.212-05:00  INFO 10904 --- [           main] org.flywaydb.core.Flyway                 : All configured schemas are empty; baseline operation skipped. A baseline or migration script with a lower version than the baseline version may execute if available. Check the Schemas parameter if this is not intended.
2025-12-17T21:57:05.218-05:00  INFO 10904 --- [           main] o.f.c.i.s.JdbcTableSchemaHistory         : Creating Schema History table "migration_test"."flyway_schema_history" ...
2025-12-17T21:57:05.548-05:00  INFO 10904 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema "migration_test": << Empty Schema >>
2025-12-17T21:57:05.558-05:00  INFO 10904 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "1.1 - create test table 1"
2025-12-17T21:57:05.667-05:00  INFO 10904 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "1.2 - Insert into test table 1"
2025-12-17T21:57:05.694-05:00  INFO 10904 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "1.3 - create test table 2"
2025-12-17T21:57:05.739-05:00  INFO 10904 --- [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 3 migrations to schema "migration_test", now at version v1.3 (execution time 00:00.132s)
```

4. Update `application.yaml` to replace `locations` with the content from `locations_2`. This will add a new migration folder that Flyway will find to determine the next set of migrations.
5. Run app again.  you will see that Flyway migrates to a new version of the schema:

```
2025-12-17T21:57:59.776-05:00  INFO 24004 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 6 migrations (execution time 00:00.051s)
2025-12-17T21:58:00.025-05:00  INFO 24004 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema "migration_test": 1.3
2025-12-17T21:58:00.044-05:00  INFO 24004 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "2.0 - create test table 3"
2025-12-17T21:58:00.158-05:00  INFO 24004 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "3.1 - create test table 4"
2025-12-17T21:58:00.204-05:00  INFO 24004 --- [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 2 migrations to schema "migration_test", now at version v3.1 (execution time 00:00.126s)
```

_Note: The baseline migration script was ignored._

6. Starting with an empty schema (either changing the target schema name, or using the below script to delete all tables in a schema):

```
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'migration_test'
    LOOP
        EXECUTE format(
            'DROP TABLE %I.%I CASCADE;',
            r.schemaname,
            r.tablename
        );
    END LOOP;
END$$;
```

7. Run the app again, which will have all migration scripts available (`db/migrations` and `db/migrations_v2`).  You will see the following output:

```
2025-12-17T22:01:40.877-05:00  INFO 12220 --- [           main] o.f.c.i.s.JdbcTableSchemaHistory         : Schema history table "migration_test"."flyway_schema_history" does not exist yet
2025-12-17T22:01:40.881-05:00  INFO 12220 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 6 migrations (execution time 00:00.039s)
2025-12-17T22:01:40.910-05:00  INFO 12220 --- [           main] org.flywaydb.core.Flyway                 : All configured schemas are empty; baseline operation skipped. A baseline or migration script with a lower version than the baseline version may execute if available. Check the Schemas parameter if this is not intended.
2025-12-17T22:01:40.915-05:00  INFO 12220 --- [           main] o.f.c.i.s.JdbcTableSchemaHistory         : Creating Schema History table "migration_test"."flyway_schema_history" ...
2025-12-17T22:01:41.256-05:00  INFO 12220 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema "migration_test": << Empty Schema >>
2025-12-17T22:01:41.266-05:00  INFO 12220 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "3.0 - baseline"
2025-12-17T22:01:41.440-05:00  INFO 12220 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema "migration_test" to version "3.1 - create test table 4"
2025-12-17T22:01:41.479-05:00  INFO 12220 --- [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 2 migrations to schema "migration_test", now at version v3.1 (execution time 00:00.174s)
```

_Note: In this mode (starting with an empty schema) only the baseline script and the `V3.1__create_test_table_4` migration was applied.   This is the desired result._

