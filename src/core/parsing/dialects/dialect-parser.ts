
import { SQLDialect, SQLStructure } from '../../../types/sql';

// Strategy interface
export interface ISQLDialectParser {
	parse(sql: string): SQLStructure;
}

export { MySQLDialectParser } from './mysql-parser';
export { PostgresDialectParser } from './postgres-parser';

// Context class
export class SQLDialectParser {
	private parser: ISQLDialectParser;

	constructor(dialect: SQLDialect) {
		   switch (dialect) {
			   case 'mysql': {
				   // Lazy import to avoid circular dependency
				   // eslint-disable-next-line @typescript-eslint/no-var-requires
				   const { MySQLDialectParser } = require('./mysql-parser');
				   this.parser = new MySQLDialectParser();
				   break;
			   }
			   case 'postgres': {
				   // eslint-disable-next-line @typescript-eslint/no-var-requires
				   const { PostgresDialectParser } = require('./postgres-parser');
				   this.parser = new PostgresDialectParser();
				   break;
			   }
			   default:
				   throw new Error(`Unsupported SQL dialect: ${dialect}`);
		   }
	}

	parse(sql: string): SQLStructure {
		return this.parser.parse(sql);
	}
}
