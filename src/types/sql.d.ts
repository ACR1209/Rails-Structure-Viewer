export type SQLTable = {
    name: string;
    columns: SQLColumn[];
};

export type SQLColumn = {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
    defaultValue?: string;
};

export type SQLStructure = {
    tables: SQLTable[];
};

export type SQLDialect = 'mysql';