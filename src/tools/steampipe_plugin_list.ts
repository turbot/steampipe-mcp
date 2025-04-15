import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { DatabaseService } from "../services/database.js";

export const tool: Tool = {
  name: "steampipe_plugin_list",
  description: "List all Steampipe plugins installed on the system.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  handler: async (db: DatabaseService) => {
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
      const query = `
        SELECT 
          plugin,
          version
        FROM steampipe_plugin
        ORDER BY plugin
      `;

      const result = await db.executeQuery(query);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ plugins: result })
        }]
      };
    } catch (err) {
      logger.error("Error listing plugins:", err);
      return {
        content: [{
          type: "text",
          text: `Failed to list plugins: ${err instanceof Error ? err.message : String(err)}`
        }],
        isError: true
      };
    }
  }
}; 