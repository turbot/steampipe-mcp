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