import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";
import { logger } from "../services/logger.js";

export const tool: Tool = {
  name: "query_steampipe",
  description: `Query cloud and security logs with SQL.
  
  Queries are read-only and must use PostgreSQL syntax. 

  Use table_list and table_show to discover available tables and columns.

  For best performance: use CTEs instead of joins, limit columns requested.
  `,
  inputSchema: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description: "The SQL query to execute. Must use PostgreSQL syntax and be read-only."
      }
    },
    required: ["sql"],
    additionalProperties: false
  },
  handler: async (db: DatabaseService | undefined, args: { sql: string }) => {
    if (!db) {
      return {
        content: [{ type: "text", text: "Database not available" }],
        isError: true,
      };
    }

    try {
      const rows = await db.executeQuery(args.sql);
      
      // Handle BigInt serialization by converting to Numbers or Strings
      const processedRows = rows.map(row => {
        const processedRow: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'bigint') {
            // Convert BigInt to a regular number if it fits within safe integer range
            if (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER) {
              processedRow[key] = Number(value);
            } else {
              // Otherwise convert to string to avoid precision loss
              processedRow[key] = value.toString();
            }
          } else {
            processedRow[key] = value;
          }
        });
        return processedRow;
      });

      return {
        content: [{ type: "text", text: JSON.stringify(processedRows) }],
        isError: false
      };
    } catch (error) {
      logger.error('Error executing query:', error);
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        isError: true
      };
    }
  }
}; 