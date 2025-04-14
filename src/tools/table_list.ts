import { DatabaseService } from "../services/database.js";
import { type Tool } from "@modelcontextprotocol/sdk/types.js";

export const tool: Tool = {
  name: "table_list",
  description: "List all unique tables in the database, excluding public and information_schema schemas",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        description: "Optional ILIKE pattern to filter table names (e.g. '%ec2%')",
      },
      schema: {
        type: "string",
        description: "Optional schema name to target table results",
      },
    },
  },
  handler: async (args: { schema?: string; filter?: string }) => {
    const db = await DatabaseService.create();
    try {
      const rows = await db.executeQuery(`
        WITH ordered_tables AS (
          SELECT DISTINCT ON (t.table_name)
            t.table_schema as schema,
            t.table_name as name,
            pg_catalog.obj_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, 'pg_class') as description,
            array_position(current_schemas(false), t.table_schema) as schema_order
          FROM information_schema.tables t
          WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'public')
            AND ($1::text IS NULL OR t.table_schema = $1)
            AND ($2::text IS NULL OR t.table_name ILIKE $2)
          ORDER BY t.table_name, schema_order NULLS LAST
        )
        SELECT 
          schema,
          name,
          description
        FROM ordered_tables
        ORDER BY name;
      `, [args.schema || null, args.filter || null]);

      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
        isError: false,
      };
    } finally {
      await db.close();
    }
  },
}; 