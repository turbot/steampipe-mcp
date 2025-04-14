import { DatabaseService } from "../services/database.js";
import { execSync } from "child_process";
import { logger } from '../services/logger.js';
import { getServerStartTime } from '../index.js';
import type { Resource } from "../types/resource.js";

export const resource: Resource = {
  uri: "tailpipe://status",
  name: "status",
  type: "Status",
  description: "Server status information including database connection, Tailpipe version, and uptime.",
  handler: async (db: DatabaseService): Promise<any> => {
    logger.debug('Handling status resource request');
    
    // Get the database path from the DatabaseService
    const dbPath = db.databasePath || 'Unknown';
    
    // Get Tailpipe CLI version (when available)
    let tailpipeVersion = 'Not installed';
    try {
      const output = execSync('tailpipe --version', { encoding: 'utf-8' });
      const versionMatch = output.trim().match(/v?(\d+\.\d+(\.\d+)?)/i);
      if (versionMatch && versionMatch[1]) {
        tailpipeVersion = versionMatch[1];
      } else {
        logger.error('Unexpected tailpipe version output format:', output);
        tailpipeVersion = output.trim();
      }
    } catch (err) {
      logger.error('Error getting tailpipe version:', err instanceof Error ? err.message : String(err));
      tailpipeVersion = 'Not installed or failed to run';
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
        path: dbPath,
        connection_status: connectionStatus
      },
      tailpipe: {
        version: tailpipeVersion
      },
      mcp_server: {
        version: "0.1.0", // Matches the version in package.json
        start_time: getServerStartTime()
      }
    };
    
    return {
      contents: [
        {
          uri: "tailpipe://status",
          mimeType: "application/json",
          text: JSON.stringify(content, null, 2)
        }
      ]
    };
  }
};