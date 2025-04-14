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
  },
  handler: async (db: DatabaseService, args: { name?: string; schema?: string }) => {
    // Check if table name is provided
    if (!args.name) {
      return {
        content: [{ type: "text", text: "Error: Table name is required" }],
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

        const rows = await db.executeQuery(`
          select 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            pg_catalog.col_description(
              (quote_ident($1) || '.' || quote_ident($2))::regclass::oid,
              c.ordinal_position
            ) as description
          from 
            information_schema.columns c
          where 
            c.table_schema = $1
            and c.table_name = $2
          order by 
            c.ordinal_position
        `, [args.schema, args.name]);

        if (rows.length === 0) {
          return {
            content: [{ type: "text", text: `Error: Table '${args.name}' not found in schema '${args.schema}'` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
          isError: false,
        };
      }

      // If no schema specified, find the first matching table in the search path
      const rows = await db.executeQuery(`
        with table_schemas as (
          select distinct
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
          from 
            pg_class c
            join pg_namespace n on n.oid = c.relnamespace
          where 
            c.relname = $1
            and c.relkind in ('r', 'v', 'm', 'f', 'p')  -- Include tables, views, materialized views, foreign tables, partitioned tables
        )
        select 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          pg_catalog.col_description(
            (quote_ident(s.first_schema) || '.' || quote_ident($1))::regclass::oid,
            c.ordinal_position
          ) as description
        from 
          table_schemas s
          join information_schema.columns c on 
            c.table_schema = s.schema_name
            and c.table_name = $1
        where
          s.schema_name = s.first_schema
        order by 
          c.ordinal_position
      `, [args.name]);

      if (rows.length === 0) {
        return {
          content: [{ type: "text", text: `Error: Table '${args.name}' not found` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
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