import { DatabaseService } from "../services/database.js";

export const QUERY_TOOL = {
  name: "query",
  description: "Run a read-only SQL query",
  inputSchema: {
    type: "object",
    properties: {
      sql: { type: "string" },
    },
  },
} as const;

export async function handleQueryTool(db: DatabaseService, args: { sql: string }) {
  const rows = await db.executeQuery(args.sql);
  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    isError: false,
  };
} 