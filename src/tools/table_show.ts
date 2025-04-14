import { DatabaseService } from "../services/database.js";
import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";

export const tool: Tool = {
  name: "table_show",
  description: "Get detailed information about a table including its columns",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the table to inspect",
      },
      schema: {
        type: "string",
        description: "Optional schema name to specify which table to inspect",
      },
    },
    required: ["name"],
    additionalProperties: false
  },
  handler: async (db: DatabaseService | undefined, args?: { name: string; schema?: string }) => {
    // Check if args is provided and has required name property
    if (!args?.name) {
      return {
        content: [{ type: "text", text: "Error: Table name is required" }],
        isError: true,
      };
    }

    // Check if database is available
    if (!db) {
      return {
        content: [{ type: "text", text: "Error: Database not available. Please ensure Steampipe service is running." }],
        isError: true,
      };
    }

    try {
      // If schema is specified, verify it exists first
      if (args.schema) {
        const schemaExists = await db.executeQuery(`
          SELECT 1 
          FROM information_schema.schemata 
          WHERE schema_name = $1
        `, [args.schema]);

        if (schemaExists.length === 0) {
          return {
            content: [{ type: "text", text: `Error: Schema '${args.schema}' not found` }],
            isError: true,
          };
        }

        // Get table metadata and columns
        const [tableInfo] = await db.executeQuery(`
          SELECT 
            t.table_schema as schema,
            t.table_name as name,
            obj_description((quote_ident($1) || '.' || quote_ident($2))::regclass::oid) as description
          FROM information_schema.tables t
          WHERE t.table_schema = $1 AND t.table_name = $2
        `, [args.schema, args.name]);

        if (!tableInfo) {
          return {
            content: [{ type: "text", text: `Error: Table '${args.name}' not found in schema '${args.schema}'` }],
            isError: true,
          };
        }

        const columns = await db.executeQuery(`
          SELECT 
            c.column_name as name,
            c.data_type as type,
            c.is_nullable,
            c.column_default as default_value,
            pg_catalog.col_description(
              (quote_ident($1) || '.' || quote_ident($2))::regclass::oid,
              c.ordinal_position
            ) as description
          FROM 
            information_schema.columns c
          WHERE 
            c.table_schema = $1
            AND c.table_name = $2
          ORDER BY 
            c.ordinal_position
        `, [args.schema, args.name]);

        return {
          content: [{ type: "text", text: JSON.stringify({ ...tableInfo, columns }, null, 2) }],
          isError: false,
        };
      }

      // If no schema specified, find the first matching table in the search path
      const [tableInfo] = await db.executeQuery(`
        WITH table_schemas AS (
          SELECT DISTINCT
            n.nspname as schema_name,
            first_value(n.nspname) over (
              partition by c.relname 
              order by 
                -- Prefer non-system schemas
                case when n.nspname = 'public' then 1
                     when n.nspname !~ '^pg_' and n.nspname <> 'information_schema' then 2
                     else 3 
                end,
                -- Then use schema name for stable ordering
                n.nspname
            ) as first_schema
          FROM 
            pg_class c
            JOIN pg_namespace n on n.oid = c.relnamespace
          WHERE 
            c.relname = $1
            AND c.relkind in ('r', 'v', 'm', 'f', 'p')
        )
        SELECT 
          s.first_schema as schema,
          t.table_name as name,
          obj_description((quote_ident(s.first_schema) || '.' || quote_ident(t.table_name))::regclass::oid) as description
        FROM 
          table_schemas s
          JOIN information_schema.tables t ON t.table_schema = s.schema_name AND t.table_name = $1
        WHERE 
          s.schema_name = s.first_schema
        LIMIT 1
      `, [args.name]);

      if (!tableInfo) {
        return {
          content: [{ type: "text", text: `Error: Table '${args.name}' not found` }],
          isError: true,
        };
      }

      const columns = await db.executeQuery(`
        SELECT 
          c.column_name as name,
          c.data_type as type,
          c.is_nullable,
          c.column_default as default_value,
          pg_catalog.col_description(
            (quote_ident($1) || '.' || quote_ident($2))::regclass::oid,
            c.ordinal_position
          ) as description
        FROM 
          information_schema.columns c
        WHERE 
          c.table_schema = $1
          AND c.table_name = $2
        ORDER BY 
          c.ordinal_position
      `, [tableInfo.schema, args.name]);

      return {
        content: [{ type: "text", text: JSON.stringify({ ...tableInfo, columns }, null, 2) }],
        isError: false,
      };
    } catch (error) {
      logger.error('Error in table_show:', error);
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
}; 