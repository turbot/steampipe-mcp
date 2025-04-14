import { DatabaseService } from "../services/database.js";
import { execSync } from "child_process";
import { logger } from '../services/logger.js';
import { getServerStartTime } from '../index.js';
import type { Resource } from "../types/resource.js";

export const resource: Resource = {
  uri: "steampipe://status",
  name: "status",
  type: "Status",
  description: "Server status information including database connection, Steampipe version, and uptime.",
  handler: async (db: DatabaseService): Promise<any> => {
    logger.debug('Handling status resource request');
    
    // Get the database connection string from the DatabaseService
    const dbConnection = db.connectionString || 'Unknown';
    
    // Get Steampipe CLI version (when available)
    let steampipeVersion = 'Not installed';
    try {
      const output = execSync('steampipe --version', { encoding: 'utf-8' });
      const versionMatch = output.trim().match(/v?(\d+\.\d+(\.\d+)?)/i);
      if (versionMatch && versionMatch[1]) {
        steampipeVersion = versionMatch[1];
      } else {
        logger.error('Unexpected steampipe version output format:', output);
        steampipeVersion = output.trim();
      }
    } catch (err) {
      logger.error('Error getting steampipe version:', err instanceof Error ? err.message : String(err));
      steampipeVersion = 'Not installed or failed to run';
    }
    
    // Get connection status
    let connectionStatus = "unknown";
    try {
      await db.testConnection();
      connectionStatus = "connected";
    } catch (error) {
      connectionStatus = "disconnected";
    }
    
    // Prepare the status response
    const content = {
      database: {
        connection_string: dbConnection,
        connection_status: connectionStatus
      },
      steampipe: {
        version: steampipeVersion
      },
      mcp_server: {
        version: "0.1.0", // Matches the version in package.json
        start_time: getServerStartTime()
      }
    };
    
    return {
      contents: [
        {
          uri: "steampipe://status",
          mimeType: "application/json",
          text: JSON.stringify(content, null, 2)
        }
      ]
    };
  }
};