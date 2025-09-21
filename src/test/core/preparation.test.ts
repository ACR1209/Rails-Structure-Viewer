import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getRailsStructureSQL } from '../../core/preparation';

suite('getRailsStructureSQL', () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;

    setup(() => {
        sandbox = sinon.createSandbox();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rails-test-'));
    });

    teardown(() => {
        sandbox.restore();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('returns undefined and shows error if no workspace folder', () => {
        sandbox.replaceGetter(vscode.workspace, 'workspaceFolders', () => undefined);
        const showError = sandbox.stub(vscode.window, 'showErrorMessage');
        const result = getRailsStructureSQL();
        assert.strictEqual(result, undefined);
        assert.ok(showError.calledWith('No workspace folder is open.'));
    });

    test('returns undefined and shows error if structure.sql does not exist', () => {
        // Create a folder but no structure.sql file
        const fakeFolder = { uri: vscode.Uri.file(tempDir), name: 'fake', index: 0 };
        sandbox.replaceGetter(vscode.workspace, 'workspaceFolders', () => [fakeFolder]);
        fs.mkdirSync(path.join(tempDir, 'db'));

        const showError = sandbox.stub(vscode.window, 'showErrorMessage');
        const result = getRailsStructureSQL();
        assert.strictEqual(result, undefined);
        assert.ok(showError.calledWith('No structure.sql file found in db directory.'));
    });

    test('returns SQL content if structure.sql exists', () => {
        const dbDir = path.join(tempDir, 'db');
        fs.mkdirSync(dbDir);

        const structurePath = path.join(dbDir, 'structure.sql');
        const fakeSQL = 'CREATE TABLE test (id INT);';
        fs.writeFileSync(structurePath, fakeSQL, 'utf-8');

        const fakeFolder = { uri: vscode.Uri.file(tempDir), name: 'fake', index: 0 };
        sandbox.replaceGetter(vscode.workspace, 'workspaceFolders', () => [fakeFolder]);

        const result = getRailsStructureSQL();
        assert.strictEqual(result, fakeSQL);
    });
});
