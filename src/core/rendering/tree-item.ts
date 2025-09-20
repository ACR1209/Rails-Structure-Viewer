import * as vscode from 'vscode';
import { SQLColumn, SQLTable } from '../../types/sql';

export class TableNode extends vscode.TreeItem {
    constructor(public table: SQLTable) {
        super(table.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = 'table';
        this.iconPath = new vscode.ThemeIcon('table');
    }
}

export class ColumnNode extends vscode.TreeItem {
    constructor(public column: SQLColumn) {
        super(
            `${column.name}: ${column.type}`,
            vscode.TreeItemCollapsibleState.None
        );
        this.contextValue = 'column';

        const badges: string[] = [];
        if (column.isPrimaryKey) badges.push('PK');
        if (!column.isNullable) badges.push('NOT NULL');
        if (column.defaultValue !== undefined) badges.push(`DEFAULT: ${column.defaultValue}`);
        if (column.foreignKey) badges.push(`FK: ${column.foreignKey.referencesTable}.${column.foreignKey.referencesColumn}`);
        if (badges.length) {
            this.label = `${this.label} [${badges.join(', ')}]`;
        }


        if (column.isPrimaryKey) {
            this.iconPath = new vscode.ThemeIcon('key'); // built-in "key" icon
        } else if (column.foreignKey) {
            this.iconPath = new vscode.ThemeIcon('arrow-right'); // FK icon
            this.command = {
                command: 'rails-structure-viewer.goToForeignTable',
                title: 'Go to Foreign Table',
                arguments: [column.foreignKey]
            };
        } 
    }
}
