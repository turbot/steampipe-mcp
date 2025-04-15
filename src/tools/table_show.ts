import { DatabaseService } from "../services/database.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";

export const tool: Tool = {
  name: "table_show",
  description: "Get detailed information about a specific Steampipe table.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description: "The name of the table to show details for. Can be schema qualified (e.g. 'aws_account' or 'aws.aws_account')."
      },
      schema: {
        type: "string",
        description: "Optional schema name. If provided, only searches in this schema. If not provided, searches across all schemas."
      }
    }
  },
  handler: async (db: DatabaseService, args: { name: string; schema?: string }) => {
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
      if (args.schema) {
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
        SELECT 
          t.table_schema as schema,
          t.table_name as name,
          t.table_type as type,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          col_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, c.ordinal_position) as description
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c 
          ON c.table_schema = t.table_schema 
          AND c.table_name = t.table_name
        WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (args.schema) {
        query += ` AND t.table_schema = $${paramIndex}`;
        params.push(args.schema);
        paramIndex++;
      }

      query += ` AND t.table_name = $${paramIndex}`;
      params.push(args.name);

      query += " ORDER BY c.ordinal_position";

      const result = await db.executeQuery(query, params);
      if (result.length === 0) {
        return {
          content: [{
            type: "text",
            text: `Table '${args.name}' not found${args.schema ? ` in schema '${args.schema}'` : ''}`
          }],
          isError: true
        };
      }

      // Format the result into table and columns structure
      const table = {
        schema: result[0].schema,
        name: result[0].name,
        type: result[0].type,
        columns: result.map(row => ({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
          ...(row.character_maximum_length && { character_maximum_length: row.character_maximum_length }),
          ...(row.numeric_precision && { numeric_precision: row.numeric_precision }),
          ...(row.numeric_scale && { numeric_scale: row.numeric_scale }),
          ...(row.description && { description: row.description })
        }))
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ table })
        }]
      };
    } catch (err) {
      logger.error("Error showing table details:", err);
      return {
        content: [{
          type: "text",
          text: `Failed to get table details: ${err instanceof Error ? err.message : String(err)}`
        }],
        isError: true
      };
    }
  }
}; 