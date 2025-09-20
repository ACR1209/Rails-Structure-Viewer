
import { SQLStructure, SQLTable, SQLColumn } from '../../../types/sql';
import { ISQLDialectParser } from './dialect-parser';

export class MySQLDialectParser implements ISQLDialectParser {
	parse(sql: string): SQLStructure {
		// Very basic parser for CREATE TABLE statements (not production ready)
		const tableRegex = /CREATE TABLE\s+`?(\w+)`?\s*\(([^;]+?)\)\s*ENGINE=/gis;
		const columnRegex = /`?(\w+)`?\s+([\w()]+)(\s+NOT NULL)?(\s+PRIMARY KEY)?/gi;
		const tables: SQLTable[] = [];

		let tableMatch;
		while ((tableMatch = tableRegex.exec(sql)) !== null) {
			const [, tableName, columnsDef] = tableMatch;
			const columns: SQLColumn[] = [];
			let columnMatch;
			while ((columnMatch = columnRegex.exec(columnsDef)) !== null) {
				const [, colName, colType, notNull, primaryKey] = columnMatch;
				columns.push({
					name: colName,
					type: colType,
					isPrimaryKey: !!primaryKey,
					isNullable: !notNull,
				});
			}
			tables.push({ name: tableName, columns });
		}
		return { tables };
	}
}
