CREATE TABLE ${schemaName}.test_table_1 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

INSERT INTO ${schemaName}.test_table_1(name) VALUES ('JavaMigration');

CREATE TABLE ${schemaName}.test_table_2 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE ${schemaName}.test_table_3 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

