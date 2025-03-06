import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DatabaseService } from "../services/database.js";

export function setupResourcesHandler(server: Server, db: DatabaseService) {
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const schemaPattern = /^postgres:\/\/schema\/([^\/]+)$/;
    const tablePattern = /^postgres:\/\/table\/([^\/]+)\/([^\/]+)$/;
    
    const schemaMatch = request.params.uri.match(schemaPattern);
    const tableMatch = request.params.uri.match(tablePattern);

    if (!schemaMatch && !tableMatch) {
      throw new Error(`Invalid resource URI: ${request.params.uri}. Expected format: postgres://schema/{name} or postgres://table/{schema}/{name}`);
    }

    if (schemaMatch) {
      const schemaName = schemaMatch[1];
      const schemaInfo = await db.getSchemaInfo(schemaName);
      
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(schemaInfo, null, 2),
          },
        ],
      };
    }
    
    // Must be a table match since we checked above
    if (!tableMatch) {
      // This should never happen due to the check above, but TypeScript doesn't know that
      throw new Error('Unexpected error: tableMatch is null');
    }

    const [schemaName, tableName] = [tableMatch[1], tableMatch[2]];
    const tableInfo = await db.getTableInfo(schemaName, tableName);

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(tableInfo, null, 2),
        },
      ],
    };
  });
} 