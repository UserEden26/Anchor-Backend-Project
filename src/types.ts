export type Column = {
  name: string;
  type: ColumnType;
  values: Map<number, any>;
};

export type SpreadSheet = {
  columns: Column[];
};

export enum ColumnType {
  BOOL = "BOOLEAN",
  STR = "STRING",
  INT = "INTEGER",
  DOUBLE = "DOUBLE",
}
