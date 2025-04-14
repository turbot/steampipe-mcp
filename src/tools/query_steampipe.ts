import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { DatabaseService } from "../services/database.js";

export const tool: Tool = {
  name: "query_steampipe",
  description: `Query cloud and security logs with SQL.
  
  Queries are read-only and must use DuckDB SQL syntax. 

  Use table_list and table_show to discover available tables and columns.
  `,
  inputSchema: {
    type: "object",
    properties: {
      sql: {
        type: "string"
      }
    }
  },
  handler: async (db: DatabaseService, args: { sql: string }) => {
    logger.debug('Executing query_steampipe tool');
    
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
        content: [{ type: "text", text: JSON.stringify(processedRows, null, 2) }],
        isError: false
      };
    } catch (error) {
      logger.error('Failed to execute query:', error instanceof Error ? error.message : String(error));
      return {
        content: [{ type: "text", text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2) }],
        isError: true
      };
    }
  }
}; 