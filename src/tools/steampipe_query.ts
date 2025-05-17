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
      return {
        content: [{ type: "text", text: JSON.stringify(rows) }],
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