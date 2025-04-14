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
  handler: async (db: DatabaseService, args?: { name?: string; schema?: string }) => {
    if (!db) {
      return {
        error: "Database not available. Please ensure Steampipe is running and try again."
      };
    }

    if (!args?.name) {
      return {
        error: "Table name is required"
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
            error: `Schema '${args.schema}' not found`
          };
        }
      }

      // Build the query based on whether schema is specified
      let query;
      let params: any[];

      if (args.schema) {
        // If schema is specified, look in that schema only
        query = `
          SELECT 
            c.table_schema as schema,
            c.table_name as name,
            c.column_name as column_name,
            c.data_type as data_type,
            c.is_nullable as is_nullable,
            c.column_default as column_default,
            c.ordinal_position as ordinal_position,
            pg_catalog.col_description(format('%I.%I', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as description
          FROM information_schema.columns c
          WHERE c.table_schema = $1
          AND c.table_name = $2
          ORDER BY c.ordinal_position
        `;
        params = [args.schema, args.name];
      } else {
        // If no schema specified, search across all non-system schemas
        query = `
          SELECT 
            c.table_schema as schema,
            c.table_name as name,
            c.column_name as column_name,
            c.data_type as data_type,
            c.is_nullable as is_nullable,
            c.column_default as column_default,
            c.ordinal_position as ordinal_position,
            pg_catalog.col_description(format('%I.%I', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as description
          FROM information_schema.columns c
          WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
          AND c.table_name = $1
          ORDER BY c.table_schema, c.ordinal_position
        `;
        params = [args.name];
      }

      const result = await db.executeQuery(query, params);
      if (result.length === 0) {
        return {
          error: args.schema 
            ? `Table '${args.name}' not found in schema '${args.schema}'`
            : `Table '${args.name}' not found in any schema`
        };
      }

      return { 
        schema: result[0].schema,
        name: result[0].name,
        columns: result.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          position: col.ordinal_position,
          description: col.description
        }))
      };
    } catch (err) {
      logger.error("Error showing table details:", err);
      return {
        error: "Failed to get table details. Please check the logs for more details."
      };
    }
  }
}; 