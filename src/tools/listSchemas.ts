import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";

export const LIST_SCHEMAS_TOOL = {
  name: "list_schemas",
  description: "List available Steampipe schemas/connections",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleListSchemasTool(db: DatabaseService) {
  const rows = await db.executeQuery(`
    select 
      plugin as "Plugin",
      connection_name as "Connection",
      case 
        when connection_name = plugin then plugin
        else plugin || '_' || connection_name
      end as "Schema",
      type as "Type",
      config as "Config"
    from steampipe_connection
    order by plugin, connection_name
  `);

  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    isError: false,
  };
} 