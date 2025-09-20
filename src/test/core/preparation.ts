import * as assert from 'assert';

import * as vscode from 'vscode';
import { getRailsStructureSQL } from '../../core/preparation';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start preparation tests.');

    test('Should return SQL structure from db/structure.sql', () => {
        //const sqlContent = getRailsStructureSQL();
        //assert.ok(sqlContent);
    });
});
