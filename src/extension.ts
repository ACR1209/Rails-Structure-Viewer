import * as vscode from 'vscode';
import { getRailsStructureSQL } from './core/preparation';
import { getSQLStructure, StructureSingleton } from './core/parsing/parsing';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "rails-structure-viewer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('rails-structure-viewer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Rails Structure Viewer!');
	});

	const disposable2 = vscode.commands.registerCommand('rails-structure-viewer.sayTablesName', () => {
		const structureString = getRailsStructureSQL();
		
		if (!structureString) {
			return;
		}

		const structure = getSQLStructure(structureString);

		structure.tables.forEach(table => {
			vscode.window.showInformationMessage(`Table: ${table.name}`);
		});

	});

	registerTableParser();

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function registerTableParser() {
	const fileWatcher = vscode.workspace.createFileSystemWatcher('**/db/structure.sql');
	
	fileWatcher.onDidChange(() => {
		const newStructure = StructureSingleton.reparse();

		if (!newStructure) {
			return;
		}

		vscode.window.showInformationMessage('Database structure updated.');
	});
	
	fileWatcher.onDidCreate(() => {
		const newStructure = StructureSingleton.reparse();
		if (!newStructure) {
			return;
		}

		vscode.window.showInformationMessage('Database structure created.');
	});
}