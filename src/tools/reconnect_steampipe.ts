import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService, type DatabaseSourceType } from "../services/database.js";
import { logger } from "../services/logger.js";
import { formatCommandError } from "../utils/command.js";
import { validateAndFormat } from "../utils/format.js";
import { buildSteampipeCommand } from "../utils/steampipe.js";

export const tool: Tool = {
  name: "reconnect_steampipe",
  description: "Reconnect to the Steampipe database, optionally using a new database path.",
  inputSchema: {
    type: "object",
    properties: {
      database_path: {
        type: "string",
        description: "Optional new database path to connect to"
      }
    }
  },
  handler: async (db: DatabaseService, args: { database_path?: string }) => {
    logger.debug('Executing reconnect_steampipe tool');

    try {
      // Close the current connection first
      logger.info('Closing current database connection...');
      await db.close();
      
      // Create a new database service instance
      const newDb = await DatabaseService.create(args.database_path);
      
      // Update the current database service with the new config
      await db.setDatabaseConfig({
        path: newDb.databasePath,
        sourceType: newDb.sourceType
      });
      
      // Close the temporary service
      await newDb.close();
      
      const result = {
        connection: {
          success: true,
          path: db.databasePath,
          source: db.sourceType === 'steampipe' ? 'steampipe CLI' : 'provided argument',
          status: "connected"
        },
        debug: {
          command: buildSteampipeCommand(`connect ${args.database_path || ''}`)
        }
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      logger.error('Failed to execute reconnect_steampipe tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, 'reconnect_steampipe');
    }
  }
};