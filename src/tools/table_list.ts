import { DatabaseService } from "../services/database.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";

export const tool: Tool = {
  name: "table_list",
  description: "List all available Steampipe tables.",
  inputSchema: {
    type: "object",
    properties: {
      schema: {
        type: "string",
        description: "Optional schema name to filter tables by"
      },
      filter: {
        type: "string",
        description: "Optional filter pattern to match against table names"
      }
    }
  },
  handler: async (db: DatabaseService, args?: { schema?: string; filter?: string }) => {
    if (!db) {
      return {
        error: "Database not available. Please ensure Steampipe is running and try again."
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
            error: `Schema '${args.schema}' not found`
          };
        }
      }

      // Build the query based on provided arguments
      let query = `
        SELECT DISTINCT 
          table_schema as schema,
          table_name as name,
          table_type as type
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
        params.push(`%${args.filter}%`);
      }

      query += " ORDER BY table_schema, table_name";

      const result = await db.executeQuery(query, params);
      return { tables: result };
    } catch (err) {
      logger.error("Error listing tables:", err);
      return {
        error: "Failed to list tables. Please check the logs for more details."
      };
    }
  }
}; 