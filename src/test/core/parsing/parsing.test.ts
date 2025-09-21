import * as assert from 'assert';
import * as sinon from 'sinon';
import * as preparation from '../../../core/preparation';
import { getSQLDialect, StructureSingleton } from '../../../core/parsing/parsing';

suite('getSQLDialect', () => {
    test('detects MySQL dialect', () => {
        const mysqlSQL = `
            CREATE TABLE users (
                id INT PRIMARY KEY,
                name VARCHAR(100)
            ) ENGINE=InnoDB;
        `;
        assert.strictEqual(getSQLDialect(mysqlSQL), 'mysql');
    });

    test('detects PostgreSQL dialect', () => {
        const postgresSQL = `
            CREATE TABLE public.users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100)
            );
            ALTER TABLE public.users OWNER TO postgres;
        `;
        assert.strictEqual(getSQLDialect(postgresSQL), 'postgres');
    });

    test('returns null for unknown dialect', () => {
        const unknownSQL = `
            CREATE TABLE users (
                id INT PRIMARY KEY,
                name VARCHAR(100)
            );
        `;
        assert.strictEqual(getSQLDialect(unknownSQL), null);
    });

    test('returns null for empty string', () => {
        assert.strictEqual(getSQLDialect(''), null);
    });

    test('returns null for non-SQL content', () => {
        const nonSQL = `This is not SQL content.`;
        assert.strictEqual(getSQLDialect(nonSQL), null);
    });
});

suite('StructureSingleton', () => {
    let getRailsStructureSQLStub: sinon.SinonStub;

    const dummySQL = `CREATE TABLE users (id INT PRIMARY KEY) ENGINE=InnoDB;`;

    setup(() => {
        getRailsStructureSQLStub = sinon.stub(preparation, 'getRailsStructureSQL').returns(dummySQL);
    });

    teardown(() => {
        getRailsStructureSQLStub.restore();
        // Reset singleton for isolation
        // @ts-ignore
        StructureSingleton.instance = null;
    });

    test('getInstance returns parsed structure', () => {
        const structure = StructureSingleton.getInstance();
        assert.ok(structure);
        assert.strictEqual(Array.isArray(structure.tables), true);
        assert.strictEqual(structure.tables[0].name, 'users');
    });

    test('getInstance returns same instance on subsequent calls', () => {
        const first = StructureSingleton.getInstance();
        const second = StructureSingleton.getInstance();
        assert.strictEqual(first, second);
    });

    test('getInstance returns null if getRailsStructureSQL returns empty', () => {
        getRailsStructureSQLStub.returns("");
        // @ts-ignore
        StructureSingleton.instance = null;
        const structure = StructureSingleton.getInstance();
        assert.strictEqual(structure, null);
    });

    test('reparse updates the singleton instance', () => {
        const first = StructureSingleton.getInstance();
        getRailsStructureSQLStub.returns(`CREATE TABLE posts (id INT PRIMARY KEY) ENGINE=InnoDB;`);
        const reparsed = StructureSingleton.reparse();
        assert.ok(reparsed);
        assert.notStrictEqual(first, reparsed);
        assert.strictEqual(reparsed.tables[0].name, 'posts');
    });

    test('reparse returns null if getRailsStructureSQL returns empty', () => {
        StructureSingleton.getInstance();
        getRailsStructureSQLStub.returns("");
        const reparsed = StructureSingleton.reparse();
        assert.strictEqual(reparsed, null);
    });
});
