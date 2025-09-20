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
            `${column.name}: ${column.type} ${column.foreignKey ? ` [FK: ${column.foreignKey.referencesTable}.${column.foreignKey.referencesColumn}]` : ''} ${column.isPrimaryKey ? ' [PK]' : ''}${column.isNullable ? '' : ' [NOT NULL]'} ${column.defaultValue !== undefined ? ` [DEFAULT: ${column.defaultValue}]` : ''}`,
            vscode.TreeItemCollapsibleState.None
        );
        this.contextValue = 'column';
    }
}
