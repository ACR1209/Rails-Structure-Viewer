import * as vscode from 'vscode';
import { SQLStructure } from "../../types/sql";
import { ColumnNode, TableNode } from './tree-item';

export class SQLTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private structure: SQLStructure) {}

    refresh(newStructure: SQLStructure) {
        this.structure = newStructure;
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            return Promise.resolve(this.structure.tables.map(table => new TableNode(table)));
        }
        if (element instanceof TableNode) {
            return Promise.resolve(element.table.columns.map(col => new ColumnNode(col)));
        }
        return Promise.resolve([]);
    }
}

