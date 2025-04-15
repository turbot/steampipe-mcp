import { DatabaseService } from "../services/database.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";

export const tool: Tool = {
  name: "steampipe_table_list",
  description: "List all available Steampipe tables. Use schema and filter parameters to narrow down results.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      schema: {
        type: "string",
        description: "Optional schema name to filter tables by. If not provided, lists tables from all schemas."
      },
      filter: {
        type: "string",
        description: "Optional filter pattern to match against table names. Use ILIKE syntax, including % as a wildcard."
      }
    }
  },
  handler: async (db: DatabaseService, args?: { schema?: string; filter?: string }) => {
    if (!db) {
      return {
        content: [{
          type: "text",
          text: "Database not available. Please ensure Steampipe is running and try again."
        }],
        isError: true
      };
    }

    try {
      // Check if schema exists if specified
      if (args?.schema) {
        const schemaQuery = `
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name = $1
        `;
        const schemaResult = await db.executeQuery(schemaQuery, [args.schema]);
        if (schemaResult.length === 0) {
          return {
            content: [{
              type: "text",
              text: `Schema '${args.schema}' not found`
            }],
            isError: true
          };
        }
      }

      // Build the query based on provided arguments
      let query = `
        SELECT DISTINCT 
          table_schema as schema,
          table_name as name,
          obj_description(format('%I.%I', table_schema, table_name)::regclass::oid, 'pg_class') as description
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (args?.schema) {
        query += ` AND table_schema = $${paramIndex}`;
        params.push(args.schema);
        paramIndex++;
      }

      if (args?.filter) {
        query += ` AND table_name ILIKE $${paramIndex}`;
        params.push(args.filter); // Use the filter pattern as-is since it already includes wildcards
      }

      query += " ORDER BY table_schema, table_name";

      const result = await db.executeQuery(query, params);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tables: result })
        }]
      };
    } catch (err) {
      logger.error("Error listing tables:", err);
      return {
        content: [{
          type: "text",
          text: `Failed to list tables: ${err instanceof Error ? err.message : String(err)}`
        }],
        isError: true
      };
    }
  }
}; 