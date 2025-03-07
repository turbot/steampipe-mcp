import { DatabaseService } from "../services/database.js";

export const LIST_TABLES_TOOL = {
  name: "list_tables",
  description: "List available tables in a specific schema with descriptions",
  inputSchema: {
    type: "object",
    properties: {
      schema: {
        type: "string",
        description: "The schema name to list tables from",
      },
    },
    required: ["schema"],
  },
} as const;

export async function handleListTablesTool(db: DatabaseService, args: { schema: string }) {
  const rows = await db.executeQuery(`
    select 
      t.table_name as "Table",
      pg_catalog.obj_description(
        (quote_ident($1) || '.' || quote_ident(t.table_name))::regclass, 
        'pg_class'
      ) as "Description"
    from 
      information_schema.tables t
    where 
      t.table_schema = $1
      and t.table_type = 'BASE TABLE'
    order by 
      t.table_name
  `, [args.schema]);

  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    isError: false,
  };
} 