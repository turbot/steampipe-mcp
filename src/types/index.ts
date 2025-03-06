export enum PromptName {
  LIST_TABLES = "list_tables",
}

export interface SchemaInfo {
  schema: string;
  tables: {
    name: string;
    type: string;
    description: string | null;
  }[];
}

export interface TableInfo {
  schema: string;
  table: string;
  description: string | null;
  columns: {
    name: string;
    type: string;
    description: string | null;
  }[];
}

export interface QueryResult {
  content: { type: string; text: string }[];
  isError: boolean;
} 