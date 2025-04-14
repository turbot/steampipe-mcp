import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListResourceTemplatesRequestSchema, type ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";

// Register all available resource templates
const resourceTemplates: ResourceTemplate[] = [];

// Export resource templates for server capabilities
export const resourceTemplateCapabilities = {
  resourceTemplates: Object.fromEntries(
    resourceTemplates.map(t => [t.name, {
      name: t.name,
      description: t.description,
      uri: t.uri,
      type: t.type
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