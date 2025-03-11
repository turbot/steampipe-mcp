import { DatabaseService } from "../services/database.js";

export const INSPECT_TABLES_TOOL = {
  name: "inspect_tables",
  description: "List all tables in a specific schema",
  inputSchema: {
    type: "object",
    properties: {
      schema: {
        type: "string",
        description: "The schema name to list tables from",
      },
      filter: {
        type: "string",
        description: "Optional SQL ILIKE pattern to filter table names (e.g., '%aws_iam_%')",
      },
    },
    required: ["schema"],
  },
} as const;

export async function handleInspectTablesTool(db: DatabaseService, args: { schema: string; filter?: string }) {
  const rows = await db.executeQuery(`
    select 
      t.table_name,
      pg_catalog.obj_description(
        (quote_ident($1) || '.' || quote_ident(t.table_name))::regclass, 
        'pg_class'
      ) as description
    from 
      information_schema.tables t
    where 
      t.table_schema = $1
      and case 
        when $2::text is not null then t.table_name ilike $2
        else true
      end
    order by 
      t.table_name
  `, [args.schema, args.filter || null]);

  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    isError: false,
  };
} 