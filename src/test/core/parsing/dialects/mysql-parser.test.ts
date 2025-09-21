import * as assert from 'assert';
import { MySQLDialectParser } from '../../../../core/parsing/dialects/mysql-parser';
import { SQLStructure } from '../../../../types/sql';

suite('MySQLDialectParser', () => {
    const simpleMySQL = [
        'CREATE TABLE `users` (',
        '  `id` int,',
        ')ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;'
    ].join('\n');

    const primaryKeyMySQLInline = [
        'CREATE TABLE `users` (',
        '  `id` int,',
        '  PRIMARY KEY (`id`)',
        ')ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;'
    ].join('\n');

    const mySQLWithFKInline = [
        'CREATE TABLE `orders` (',
        '  `id` int,',
        '  `user_id` int,',
        '  PRIMARY KEY (`id`),',
        '  CONSTRAINT `fk_rails_220b011615` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),',
        ')ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;'
    ].join('\n');

    const notNullMySQL = [
        'CREATE TABLE `users` (',
        '  `id` int NOT NULL,',
        ')ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;'
    ].join('\n');

    const defaultMySQL = [
        'CREATE TABLE `users` (',
        '  `id` int DEFAULT 0,',
        ')ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;'
    ].join('\n');

    test('parses MySQL tables correctly', () => {
        const parser = new MySQLDialectParser();
        const structure: SQLStructure = parser.parse(simpleMySQL);
        assert.strictEqual(structure.tables.length, 1);
        const table = structure.tables[0];
        assert.strictEqual(table.name, 'users');
    });

    test('parses MySQL with only type declarations', () => {
        const parser = new MySQLDialectParser();
        const structure: SQLStructure = parser.parse(simpleMySQL);
        const table = structure.tables[0];
        assert.strictEqual(table.columns.length, 1);
        const [id] = table.columns;
        assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
        assert.strictEqual(id.type, 'int', "Expected column type to be 'int'");
        assert.strictEqual(id.isPrimaryKey, false, "Expected isPrimaryKey to be false");
        assert.strictEqual(id.isNullable, true, "Expected isNullable to be true");
    });

    test('parses MySQL primary key inline', () => {
        const parser = new MySQLDialectParser();
        const structure: SQLStructure = parser.parse(primaryKeyMySQLInline);
        assert.strictEqual(structure.tables.length, 1, 'Expected one table to be parsed');
        const table = structure.tables[0];
        assert.strictEqual(table.name, 'users', 'Expected table name to be users');
        assert.strictEqual(table.columns.length, 1, 'Expected one column to be parsed');
        const [id] = table.columns;
        assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
        assert.strictEqual(id.isPrimaryKey, true, "Expected isPrimaryKey to be true");
    });

    test('parses MySQL foreign key inline', () => {
        const parser = new MySQLDialectParser();
        const structure: SQLStructure = parser.parse(simpleMySQL + '\n' + mySQLWithFKInline);
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

    test('parses MySQL NOT NULL constraint', () => {
        const parser = new MySQLDialectParser();
        const structure: SQLStructure = parser.parse(notNullMySQL);
        assert.strictEqual(structure.tables.length, 1, 'Expected one table to be parsed');
        const table = structure.tables[0];
        assert.strictEqual(table.name, 'users', 'Expected table name to be users');
        assert.strictEqual(table.columns.length, 1, 'Expected one column to be parsed');
        const [id] = table.columns;
        assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
        assert.strictEqual(id.isNullable, false, "Expected isNullable to be false");
    });

    test('parses MySQL DEFAULT value', () => {
        const parser = new MySQLDialectParser();
        const structure: SQLStructure = parser.parse(defaultMySQL);
        assert.strictEqual(structure.tables.length, 1, 'Expected one table to be parsed');
        const table = structure.tables[0];
        assert.strictEqual(table.name, 'users', 'Expected table name to be users');
        assert.strictEqual(table.columns.length, 1, 'Expected one column to be parsed');
        const [id] = table.columns;
        assert.strictEqual(id.name, 'id', "Expected column name to be 'id'");
        assert.strictEqual(id.defaultValue, '0', "Expected defaultValue to be '0'");
    });
});