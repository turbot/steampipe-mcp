import { ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { logger } from '../services/logger.js';
import type { ResourceTemplate } from "../types/resourceTemplate.js";

// Register all available resource templates
const resourceTemplates: ResourceTemplate[] = [
  // No templates yet, but they would be registered here
];

// Export resource templates for server capabilities
export const resourceTemplateCapabilities = {
  resourceTemplates: Object.fromEntries(
    resourceTemplates.map(t => [t.name, {
      uri: t.uri,
      name: t.name,
      type: t.type,
      description: t.description
    }])
  )
};

export function setupResourceTemplateHandlers(server: Server) {
  // Register resource template list handler
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    try {
      return { resourceTemplates: Object.values(resourceTemplateCapabilities.resourceTemplates) };
    } catch (error) {
      // Log the error but don't fail - return default templates
      if (error instanceof Error) {
        logger.error("Critical error listing resource templates:", error.message);
      } else {
        logger.error("Critical error listing resource templates:", error);
      }
      
      // Return empty list on error
      return { resourceTemplates: [] };
    }
  });
} 