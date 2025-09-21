
import { SQLStructure, SQLTable, SQLColumn } from '../../../types/sql';
import { ISQLDialectParser } from './dialect-parser';

export class MySQLDialectParser implements ISQLDialectParser {
    parse(sql: string): SQLStructure {
        const tableRegex = /CREATE TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)\s*ENGINE=/gi;
        const columnRegex = /^\s*`?(\w+)`?\s+([\w()]+)(\s+NOT NULL)?/i;
        const defaultRegex = /DEFAULT\s+((?:'[^']*')|(?:"[^"]*")|(?:[\w.\-+]+))/i;
        const foreignKeyRegex = /(?:CONSTRAINT\s+`?\w+`?\s+)?FOREIGN KEY\s*\(`?(\w+)`?\)\s+REFERENCES\s+`?(\w+)`?\s*\(`?(\w+)`?\)/i;
        const tables: SQLTable[] = [];

        let tableMatch;

        while ((tableMatch = tableRegex.exec(sql)) !== null) {
            const [, tableName, columnsDef] = tableMatch;
            const columns: SQLColumn[] = [];

            const lines = columnsDef.split(/,\r?\n/);
            const constraintLines: string[] = [];

            // First pass: parse columns and collect constraint lines
            for (const line of lines) {
                const trimmed = line.trim();
                if (/^(PRIMARY|UNIQUE|KEY|CONSTRAINT|FOREIGN)/i.test(trimmed)) {
                    constraintLines.push(trimmed);
                    continue;
                }

                const colMatch = columnRegex.exec(trimmed);
                if (!colMatch) {continue;}

                const [, colName, colType, notNull] = colMatch;

                let defaultValue: string | undefined = undefined;
                const defaultMatch = defaultRegex.exec(trimmed);
                if (defaultMatch) {
                    defaultValue = defaultMatch[1];
                    if ((defaultValue.startsWith("'") && defaultValue.endsWith("'")) || (defaultValue.startsWith('"') && defaultValue.endsWith('"'))) {
                        defaultValue = defaultValue.substring(1, defaultValue.length - 1);
                    }
                }

                columns.push({
                    name: colName,
                    type: colType,
                    isPrimaryKey: false, // will be set later
                    isNullable: !notNull,
                    ...(defaultValue !== undefined ? { defaultValue } : {}),
                });
            }

            // Single pass: handle constraints (primary key, foreign key)
            for (const trimmed of constraintLines) {
                // Primary key
                const pkMatch = /^PRIMARY KEY\s*\((.+?)\)/i.exec(trimmed);
                if (pkMatch) {
                    const pkColumns = pkMatch[1]
                        .split(',')
                        .map(c => c.replace(/`/g, '').trim());
                    for (const col of columns) {
                        if (pkColumns.includes(col.name)) {
                            col.isPrimaryKey = true;
                        }
                    }
                    continue;
                }

                // Foreign key
                const fkMatch = foreignKeyRegex.exec(trimmed);
                if (fkMatch) {
                    const [, fkColRaw, refTable, refColRaw] = fkMatch;
                    const fkCol = fkColRaw.replace(/`/g, '');
                    const refCol = refColRaw.replace(/`/g, '');
                    const col = columns.find(c => c.name === fkCol);
                    if (col) {
                        col.foreignKey = {
                            column: fkCol,
                            referencesTable: refTable,
                            referencesColumn: refCol,
                        };
                    }
                    continue;
                }
            }

            tables.push({ name: tableName, columns });
        }

        return { tables };
    }
}
