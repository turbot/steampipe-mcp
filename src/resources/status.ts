import { DatabaseService } from "../services/database.js";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";

export const resource: Resource = {
  uri: "steampipe://status",
  name: "status",
  type: "status",
  description: "Status of the Steampipe database connection",
  handler: async (db: DatabaseService) => {
    return {
      contents: [{
        uri: "steampipe://status",
        mimeType: "application/json",
        text: JSON.stringify({
          connection_string: db.connectionString,
          source: "steampipe",
          status: "connected"
        }, null, 2)
      }]
    };
  }
};