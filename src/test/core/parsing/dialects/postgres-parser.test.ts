import * as assert from 'assert';
import { SQLStructure } from '../../../../types/sql';
import { PostgresDialectParser } from '../../../../core/parsing/dialects/postgres-parser';

suite('PostgresDialectParser', () => {
        const simplePgSQL = [
            'CREATE TABLE users (',
            '  id serial,',
            ');'
        ].join('\n');

        const twoTablesPgSQL = [
            'CREATE TABLE users (',
            '  id serial,',
            ');',
            'CREATE TABLE orders (',
            '  id serial,',
            '  user_id integer',
            ');'
        ].join('\n');

        const primaryKeyPgSQLInline = [
            'CREATE TABLE users (',
            '  id serial PRIMARY KEY,',
            ');'
        ].join('\n');

        const pgSQLWithFKInline = [
            'CREATE TABLE orders (',
            '  id serial PRIMARY KEY,',
            '  user_id integer REFERENCES users(id)',
            ');'
        ].join('\n');

        const alterTablePrimaryKey = [
            'ALTER TABLE ONLY users',
            '    ADD CONSTRAINT users_pkey PRIMARY KEY (id);'
        ].join('\n');

        const alterTableForeignKey = [
            'ALTER TABLE ONLY orders',
            '    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);'
        ].join('\n');
        

        test('parses Postgres tables correctly', () => {
            const parser = new PostgresDialectParser();
            const structure: SQLStructure = parser.parse(simplePgSQL);
            assert.strictEqual(structure.tables.length, 1);
            const table = structure.tables[0];
            assert.strictEqual(table.name, 'users');
        });

        test('parses Postgres with only type declarations', () => {
            const parser = new PostgresDialectParser();
            const structure: SQLStructure = parser.parse(simplePgSQL);
            const table = structure.tables[0];
            assert.strictEqual(table.columns.length, 1);
            const [id] = table.columns;
            assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
            assert.strictEqual(id.type, 'serial', "Expected column type to be 'serial'");
            assert.strictEqual(id.isPrimaryKey, false, "Expected isPrimaryKey to be false");
            assert.strictEqual(id.isNullable, true, "Expected isNullable to be true");
        });

		test('parses Postgres primary key from ALTER TABLE', () => {
            const parser = new PostgresDialectParser();
            const structure: SQLStructure = parser.parse(simplePgSQL + '\n' + alterTablePrimaryKey);
            assert.strictEqual(structure.tables.length, 1, 'Expected one table to be parsed');
            const table = structure.tables[0];
            assert.strictEqual(table.name, 'users', 'Expected table name to be users');
            assert.strictEqual(table.columns.length, 1, 'Expected one column to be parsed');
            const [id] = table.columns;
            assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
            assert.strictEqual(id.isPrimaryKey, true, "Expected isPrimaryKey to be true");
        });

        test('parses Postgres primary key inline', () => {
            const parser = new PostgresDialectParser();
            const structure: SQLStructure = parser.parse(primaryKeyPgSQLInline);
            assert.strictEqual(structure.tables.length, 1, 'Expected one table to be parsed');
            const table = structure.tables[0];
            assert.strictEqual(table.name, 'users', 'Expected table name to be users');
            assert.strictEqual(table.columns.length, 1, 'Expected one column to be parsed');
            const [id] = table.columns;
            assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
            assert.strictEqual(id.isPrimaryKey, true, "Expected isPrimaryKey to be true");
        });

        test('parses Postgres foreign key inline', () => {
            const parser = new PostgresDialectParser();
            const structure: SQLStructure = parser.parse(simplePgSQL + '\n' + pgSQLWithFKInline );
            assert.strictEqual(structure.tables.length, 2, 'Expected two tables to be parsed');
            const table = structure.tables[1];
            assert.strictEqual(table.name, 'orders', 'Expected table name to be orders');
            assert.strictEqual(table.columns.length, 2, 'Expected two columns to be parsed');
            const [id, user_id] = table.columns;
            assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
            assert.strictEqual(id.isPrimaryKey, true, "Expected isPrimaryKey to be true");
            assert.strictEqual(user_id.name, 'user_id', "Expected column name to be 'user_id'");
            assert.strictEqual(user_id.foreignKey?.referencesTable, 'users', "Expected foreign key referencesTable to be 'users'");
            assert.strictEqual(user_id.foreignKey?.referencesColumn, 'id', "Expected foreign key referencesColumn to be 'id'");
        });

        test('parses Postgres foreign key from ALTER TABLE', () => {
            const parser = new PostgresDialectParser();
            const structure: SQLStructure = parser.parse(twoTablesPgSQL + '\n' + alterTableForeignKey);
            assert.strictEqual(structure.tables.length, 2, 'Expected two tables to be parsed');
            const table = structure.tables[1];
            assert.strictEqual(table.name, 'orders', 'Expected table name to be orders');   
            assert.strictEqual(table.columns.length, 2, 'Expected two columns to be parsed');
            const [id, user_id] = table.columns;
            assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
            assert.strictEqual(user_id.name, 'user_id', "Expected column name to be 'user_id'");
            assert.strictEqual(user_id.foreignKey?.referencesTable, 'users', "Expected foreign key referencesTable to be 'users'");
            assert.strictEqual(user_id.foreignKey?.referencesColumn, 'id', "Expected foreign key referencesColumn to be 'id'");
        });
	});