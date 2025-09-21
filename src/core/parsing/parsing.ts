
import { SQLDialect, SQLStructure } from "../../types/sql";
import { getRailsStructureSQL } from "../preparation";
import { SQLDialectParser } from "./dialects/dialect-parser";
import * as vscode from 'vscode';

export function getSQLDialect(sql: string): SQLDialect | null {
    if (sql.includes('CREATE TABLE') && sql.includes('ENGINE=')) {
        return 'mysql';
    }
    if (sql.includes('CREATE TABLE') && sql.match(/\bOWNER TO\b|\bSET search_path\b|\bpublic\./i)) {
        return 'postgres';
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

export class StructureSingleton {
	private static instance: ReturnType<typeof getSQLStructure> | null = null;

	static getInstance() {
		if (!StructureSingleton.instance) {
			const structureString = getRailsStructureSQL();
			if (!structureString) {
				return null;
			}
			StructureSingleton.instance = getSQLStructure(structureString);
		}
		return StructureSingleton.instance;
	}

    static reparse() {
        const structureString = getRailsStructureSQL();
        if (!structureString) {
            return null;
        }
     
        StructureSingleton.instance = getSQLStructure(structureString);
        return StructureSingleton.instance;
    }
}
