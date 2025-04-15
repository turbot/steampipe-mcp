import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { DatabaseService } from "../services/database.js";

export const tool: Tool = {
  name: "steampipe_plugin_show",
  description: "Get details for a specific Steampipe plugin installation.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the plugin to show details for"
      }
    },
    required: ["name"],
    additionalProperties: false
  },
  handler: async (db: DatabaseService, args: { name: string }) => {
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
          plugin_instance,
          plugin,
          version,
          memory_max_mb,
          limiters,
          file_name,
          start_line_number,
          end_line_number
        FROM steampipe_plugin
        WHERE plugin = $1
      `;

      const result = await db.executeQuery(query, [args.name]);
      
      if (result.length === 0) {
        return {
          content: [{
            type: "text",
            text: `Plugin '${args.name}' not found`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ plugin: result[0] })
        }]
      };
    } catch (err) {
      logger.error("Error showing plugin details:", err);
      return {
        content: [{
          type: "text",
          text: `Failed to get plugin details: ${err instanceof Error ? err.message : String(err)}`
        }],
        isError: true
      };
    }
  }
}; 