import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";
import { logger } from "../services/logger.js";

export const tool: Tool = {
  name: "steampipe_query",
  description: `Query cloud infrastructure, SaaS, APIs, code and more with SQL.
  
  Queries are read-only and must use PostgreSQL syntax. 

  For best performance: limit columns requested, use materialized CTEs instead
  of joins. Trust the search path unless sure you need to specify a schema.

  Check available tables and columns before querying using steampipe_table_list
  and steampipe_table_show.`,
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