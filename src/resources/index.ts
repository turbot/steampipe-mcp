import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DatabaseService } from "../services/database.js";
import { resource as statusResource } from "./status.js";
import { logger } from '../services/logger.js';
import type { Resource } from "../types/resource.js";

// Register all available resources
const resources: Resource[] = [
  statusResource
];

// Export resources for server capabilities
export const resourceCapabilities = {
  resources: Object.fromEntries(
    resources.map(r => [r.name, {
      uri: r.uri,
      name: r.name,
      type: r.type,
      description: r.description
    }])
  )
};

export function setupResourceHandlers(server: Server, db: DatabaseService) {
  // Register resource list handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      return { resources: Object.values(resourceCapabilities.resources) };
    } catch (error) {
      // Log the error but don't fail - return default resources
      if (error instanceof Error) {
        logger.error("Critical error listing resources:", error.message);
      } else {
        logger.error("Critical error listing resources:", error);
      }
      
      // Return empty list on error
      return { resources: [] };
    }
  });

  // Register resource read handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Find matching resource
    const resource = resources.find(r => r.uri === uri);
    if (!resource) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    // Handle the resource request
    return resource.handler(db);
  });
} 