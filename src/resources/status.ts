import { DatabaseService } from "../services/database.js";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";

type ResourceHandler = (db: DatabaseService) => Promise<{
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}>;

export const resource: Resource & { handler: ResourceHandler } = {
  uri: "steampipe://status",
  name: "status",
  type: "status",
  description: "Get the current status of the Steampipe connection",
  handler: async (db: DatabaseService) => {
    // Get the current config and connection state
    const connectionString = db.configConnectionString;
    const sourceType = db.configSourceType;
    const isConnected = db.isConnected;

    return {
      contents: [{
        uri: "steampipe://status",
        mimeType: "application/json",
        text: JSON.stringify({
          connection_string: connectionString,
          source: sourceType,
          status: isConnected ? "connected" : "disconnected"
        }, null, 2)
      }]
    };
  }
};