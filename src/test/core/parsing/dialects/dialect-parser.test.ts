
import * as assert from 'assert';
import { SQLDialectParser } from '../../../../core/parsing/dialects/dialect-parser';

suite('SQLDialectParser', () => {
	test('creates MySQL parser for mysql dialect', () => {
        const parser: SQLDialectParser = new SQLDialectParser('mysql');
        // @ts-ignore
        assert.strictEqual(parser.parser.constructor.name, 'MySQLDialectParser');
    });

    test('creates Postgres parser for postgres dialect', () => {
        const parser: SQLDialectParser = new SQLDialectParser('postgres');
        // @ts-ignore
        assert.strictEqual(parser.parser.constructor.name, 'PostgresDialectParser');
    });

    test('throws error for unsupported dialect', () => {
        assert.throws(() => new SQLDialectParser('aeaea' as any), /Unsupported SQL dialect: aeaea/);
    });

    test('has parse method that delegates to specific parser', () => {
        const parser: SQLDialectParser = new SQLDialectParser('mysql');
        assert.strictEqual(typeof parser.parse, 'function');
    });
});

