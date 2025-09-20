import path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export function getRailsStructureSQL() {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders) {
		vscode.window.showErrorMessage('No workspace folder is open.');
		return;
	}

	const rootPath = workspaceFolders[0].uri.fsPath;
	const structurePath = path.join(rootPath, 'db', 'structure.sql');

	if(!fs.existsSync(structurePath)) {
		vscode.window.showErrorMessage('No structure.sql file found in db directory.');
		return;
	}

	const sqlContent = fs.readFileSync(structurePath, 'utf-8');

	return sqlContent;
}