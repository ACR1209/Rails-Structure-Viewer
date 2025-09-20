
import { SQLStructure, SQLTable, SQLColumn } from '../../../types/sql';
import { ISQLDialectParser } from './dialect-parser';

export class MySQLDialectParser implements ISQLDialectParser {
    parse(sql: string): SQLStructure {
        const tableRegex = /CREATE TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)\s*ENGINE=/gi;
        const columnRegex = /^\s*`?(\w+)`?\s+([\w()]+)(\s+NOT NULL)?/i;

        const tables: SQLTable[] = [];

        let tableMatch;
        while ((tableMatch = tableRegex.exec(sql)) !== null) {
            const [, tableName, columnsDef] = tableMatch;
            const columns: SQLColumn[] = [];

            const lines = columnsDef.split(/,\r?\n/);

            // First pass: parse columns
            for (const line of lines) {
                const trimmed = line.trim();

                // Skip constraints
                if (/^(PRIMARY|UNIQUE|KEY|CONSTRAINT)/i.test(trimmed)) continue;

                const colMatch = columnRegex.exec(trimmed);
                if (!colMatch) continue;

                const [, colName, colType, notNull] = colMatch;
                columns.push({
                    name: colName,
                    type: colType,
                    isPrimaryKey: false, // will be set later
                    isNullable: !notNull,
                });
            }

            // Second pass: in order to detect primary key definitions
            for (const line of lines) {
                const trimmed = line.trim();
                const pkMatch = /^PRIMARY KEY\s*\((.+?)\)/i.exec(trimmed);
                if (!pkMatch) continue;

                const pkColumns = pkMatch[1]
                    .split(',')
                    .map(c => c.replace(/`/g, '').trim());

                for (const col of columns) {
                    if (pkColumns.includes(col.name)) {
                        col.isPrimaryKey = true;
                    }
                }
            }

            tables.push({ name: tableName, columns });
        }

        return { tables };
    }
}
