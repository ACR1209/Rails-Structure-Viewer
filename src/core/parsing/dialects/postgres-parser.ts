import { SQLStructure, SQLTable, SQLColumn } from '../../../types/sql';
import { ISQLDialectParser } from './dialect-parser';

export class PostgresDialectParser implements ISQLDialectParser {
    parse(sql: string): SQLStructure {
        const tableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?("?[\w\.]+"?)\s*\(([\s\S]*?)\);/gi;
        const columnRegex = /^\s*"?(?<name>\w+)"?\s+(?<type>.+?)(?:\s+DEFAULT\s+(?<default>.+?))?(?:\s+(?<notnull>NOT NULL))?\s*$/i;
        const tables: SQLTable[] = [];

        let tableMatch;
        while ((tableMatch = tableRegex.exec(sql)) !== null) {
            const [, tableNameRaw, columnsDef] = tableMatch;
            const tableName = tableNameRaw.replace(/"/g, '').replace('public.', '');
            const columns: SQLColumn[] = [];
            const constraintLines: string[] = [];
            const lines = columnsDef.split(/,\r?\n/);

            // First pass: parse columns and collect table-level constraints
            for (const line of lines) {
                const trimmed = line.trim();

                if (/^(PRIMARY|UNIQUE|KEY|CONSTRAINT|FOREIGN)/i.test(trimmed)) {
                    constraintLines.push(trimmed);
                    continue;
                }

                const colMatch = columnRegex.exec(trimmed);
                if (!colMatch || !colMatch.groups) continue;

                let { name: colName, type: colTypeRaw, notnull, default: defaultValueRaw } = colMatch.groups;
                let colType = colTypeRaw.trim();

                // Inline PRIMARY KEY
                let isPrimaryKey = false;
                if (/PRIMARY\s+KEY/i.test(colType)) {
                    isPrimaryKey = true;
                    colType = colType.replace(/PRIMARY\s+KEY/i, '').trim();
                }

                // Inline FOREIGN KEY
                let foreignKey;
                const fkInlineMatch = colType.match(/REFERENCES\s+"?([\w\.]+)"?\s*\(([\w,\s]+)\)/i);
                if (fkInlineMatch) {
                    const [, refTableRaw, refColsRaw] = fkInlineMatch;
                    const refTable = refTableRaw.replace('public.', '');
                    const refCols = refColsRaw.split(',').map(c => c.trim());

                    foreignKey = {
                        column: colName,
                        referencesTable: refTable,
                        referencesColumn: refCols[0], // usually one column inline
                    };

                    colType = colType.replace(fkInlineMatch[0], '').trim();
                }

                // Clean default value
                let defaultValue = defaultValueRaw;
                if (defaultValue) {
                    defaultValue = defaultValue.trim();
                    if ((defaultValue.startsWith("'") && defaultValue.endsWith("'")) ||
                        (defaultValue.startsWith('"') && defaultValue.endsWith('"'))) {
                        defaultValue = defaultValue.substring(1, defaultValue.length - 1);
                    }
                    defaultValue = defaultValue.split('::')[0].trim();
                }

                columns.push({
                    name: colName,
                    type: colType,
                    isPrimaryKey,
                    isNullable: !notnull,
                    ...(defaultValue ? { defaultValue } : {}),
                    ...(foreignKey ? { foreignKey } : {}),
                });
            }

            // Process table-level foreign keys from CREATE TABLE constraints
            const fkRegex = /FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+"?([\w\.]+)"?\s*\(([^)]+)\)/gi;
            for (const constraint of constraintLines) {
                let fkMatch;
                while ((fkMatch = fkRegex.exec(constraint)) !== null) {
                    const [, fkColsRaw, refTableRaw, refColsRaw] = fkMatch;
                    const fkCols = fkColsRaw.split(',').map(c => c.replace(/"/g, '').trim());
                    const refCols = refColsRaw.split(',').map(c => c.replace(/"/g, '').trim());
                    const refTable = refTableRaw.replace('public.', '');

                    fkCols.forEach((fkCol, idx) => {
                        const col = columns.find(c => c.name === fkCol);
                        if (col) {
                            col.foreignKey = {
                                column: fkCol,
                                referencesTable: refTable,
                                referencesColumn: refCols[idx] || refCols[0],
                            };
                        }
                    });
                }
            }

            tables.push({ name: tableName, columns });
        }

        // Handle PRIMARY KEYs added via ALTER TABLE
        const pkRegex = /ALTER TABLE ONLY "?([\w\.]+)"?\s+ADD CONSTRAINT "?[\w]+"?\s+PRIMARY KEY\s*\(([^)]+)\)/gi;
        let pkMatch;
        while ((pkMatch = pkRegex.exec(sql)) !== null) {
            const [, tableNameRaw, colsRaw] = pkMatch;
            const tableName = tableNameRaw.replace('public.', '');
            const table = tables.find(t => t.name === tableName);
            if (!table) continue;

            const pkCols = colsRaw.split(',').map(c => c.replace(/"/g, '').trim());
            table.columns.forEach(col => {
                if (pkCols.includes(col.name)) col.isPrimaryKey = true;
            });
        }

        // Handle FOREIGN KEYs added via ALTER TABLE
        const alterFkRegex = /ALTER TABLE ONLY "?([\w\.]+)"?\s+ADD CONSTRAINT "?[\w]+"?\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+"?([\w\.]+)"?\s*\(([^)]+)\)/gi;
        let alterFkMatch;
        while ((alterFkMatch = alterFkRegex.exec(sql)) !== null) {
            const [, tableNameRaw, fkColsRaw, refTableRaw, refColsRaw] = alterFkMatch;
            const tableName = tableNameRaw.replace('public.', '');
            const table = tables.find(t => t.name === tableName);
            if (!table) continue;

            const fkCols = fkColsRaw.split(',').map(c => c.replace(/"/g, '').trim());
            const refCols = refColsRaw.split(',').map(c => c.replace(/"/g, '').trim());
            const refTable = refTableRaw.replace('public.', '');

            fkCols.forEach((fkCol, idx) => {
                const col = table.columns.find(c => c.name === fkCol);
                if (col) {
                    col.foreignKey = {
                        column: fkCol,
                        referencesTable: refTable,
                        referencesColumn: refCols[idx] || refCols[0],
                    };
                }
            });
        }

        return { tables };
    }
}
