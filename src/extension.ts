import * as vscode from 'vscode';
import { StructureSingleton } from './core/parsing/parsing';
import { SQLTreeProvider } from './core/rendering/tree-data-provider';
import { TableNode } from './core/rendering/tree-item';

let treeProvider: SQLTreeProvider;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const structure = StructureSingleton.getInstance();

	if (!structure) {
		return;
	}

    treeProvider = new SQLTreeProvider(structure);

	vscode.window.registerTreeDataProvider('railsStructureView', treeProvider);

	// Watch for changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/db/structure.sql');
    watcher.onDidChange(() => updateStructure());
    watcher.onDidCreate(() => updateStructure());


	const disposableOpenTreeView = vscode.commands.registerCommand('rails-structure-viewer.openTreeView', async () => {
		await vscode.commands.executeCommand('workbench.view.explorer');
		await vscode.commands.executeCommand('railsStructureView.focus');
	});


	const goToForeignTableCmd = vscode.commands.registerCommand(
        'rails-structure-viewer.goToForeignTable',
        (foreignKey: { referencesTable: string; referencesColumn: string }) => {

            // Example: focus the table in your tree view
            const tableNode = treeProvider?.findTable(foreignKey.referencesTable);
            if (tableNode) {
                treeProvider.revealTable(tableNode);
            }
        }
    );

    const refreshCmd = vscode.commands.registerCommand('rails-structure-viewer.refreshStructure', () => {
		console.log('Refreshing structure...');
		updateStructure();
    });

    context.subscriptions.push(watcher);
    context.subscriptions.push(disposableOpenTreeView);
    context.subscriptions.push(goToForeignTableCmd);
    context.subscriptions.push(refreshCmd);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function updateStructure() {
    const newStructure = StructureSingleton.reparse();
    
	if (!treeProvider || !newStructure) {
        return;
    }

    treeProvider.refresh(newStructure);
    vscode.window.showInformationMessage('Database structure updated!');
}