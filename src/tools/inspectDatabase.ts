import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";

export const INSPECT_DATABASE_TOOL = {
  name: "inspect_database",
  description: "List all schemas in the database",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        description: "Optional SQL ILIKE pattern to filter schema names (e.g., '%aws%')",
      },
    },
  },
} as const;

export async function handleInspectDatabaseTool(db: DatabaseService, args?: { filter?: string }) {
  const rows = await db.executeQuery(`
    select 
      plugin,
      name,
      state,
      type,
      connections,
      error
    from
      steampipe_connection
    where
      case 
        when $1::text is not null then name ilike $1
        else true
      end
    order by
      plugin,
      name
  `, [args?.filter || null]);

  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    isError: false,
  };
} 