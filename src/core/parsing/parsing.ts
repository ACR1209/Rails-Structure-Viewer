
import { SQLDialect, SQLStructure } from "../../types/sql";
import { SQLDialectParser } from "./dialects/dialect-parser";

export function getSQLDialect(sql: string): SQLDialect | null {
    if (sql.includes('CREATE TABLE') && sql.includes('ENGINE=')) {
        return 'mysql';
    }

    return null;
}

export function getSQLStructure(sql: string): SQLStructure {
    const dialect = getSQLDialect(sql);
    if (!dialect) {
        return { tables: [] };
    }

    const parser = new SQLDialectParser(dialect);
    return parser.parse(sql);
}
