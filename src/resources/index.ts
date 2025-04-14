import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ReadResourceRequestSchema, type Resource } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";
import { resource as statusResource } from "./status.js";
import { logger } from '../services/logger.js';

// Export all resources for server capabilities
export const resources = {
  status: statusResource,
};

// Initialize resource handlers
export function setupResources(server: Server, db: DatabaseService) {
  // Register resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const resource = Object.values(resources).find(r => r.uri === uri);

    if (!resource) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    if (!resource.handler) {
      throw new Error(`Resource ${uri} has no handler defined`);
    }

    return await (resource.handler as (db: DatabaseService) => Promise<any>)(db);
  });
} 