export enum PromptName {
  LIST_TABLES = "list_tables",
}

export interface QueryResult {
  content: { type: string; text: string }[];
  isError: boolean;
} 