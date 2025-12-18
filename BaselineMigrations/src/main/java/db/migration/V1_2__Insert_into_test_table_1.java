package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Statement;

/**
 *
 * A Java migration for flyway, insets data into a table created with the V1 migration.
 * @author cknoll1
 */
public class V1_2__Insert_into_test_table_1 extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        String schemaName = context.getConfiguration().getPlaceholders().get("schemaName");
        try (Statement stmt = context.getConnection().createStatement()) {
            stmt.execute("INSERT INTO " + schemaName + ".test_table_1(name) VALUES ('JavaMigration');");
        }
    }
}
