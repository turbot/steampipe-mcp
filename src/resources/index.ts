import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DatabaseService } from "../services/database.js";
import { handleSchemaResource } from "./schema.js";
import { handleTableResource } from "./table.js";

export function setupResourceHandlers(server: Server, db: DatabaseService) {
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Try each handler in sequence
    const result = await handleSchemaResource(uri, db) 
      || await handleTableResource(uri, db);

    if (!result) {
      throw new Error(`Invalid resource URI: ${uri}. Expected format: postgres://schema/{name} or postgres://table/{schema}/{name}`);
    }

    return result;
  });
} 