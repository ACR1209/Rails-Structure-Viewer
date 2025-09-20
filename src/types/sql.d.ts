export type SQLTable = {
    name: string;
    columns: SQLColumn[];
};

export type SQLColumn = {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
};

export type SQLStructure = {
    tables: SQLTable[];
};

export type SQLDialect = 'mysql';