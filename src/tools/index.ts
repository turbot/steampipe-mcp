import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DatabaseService } from "../services/database.js";
import { QUERY_TOOL, handleQueryTool } from './query.js';
import { CLEAR_CACHE_TOOL, handleClearCacheTool } from './clearCache.js';
import { LIST_SCHEMAS_TOOL, handleListSchemasTool } from './listSchemas.js';

export * from './query.js';
export * from './clearCache.js';
export * from './listSchemas.js';

export function setupTools(server: Server, db: DatabaseService) {
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        QUERY_TOOL,
        CLEAR_CACHE_TOOL,
        LIST_SCHEMAS_TOOL,
      ],
    };
  });

  // Register unified tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case QUERY_TOOL.name:
        return handleQueryTool(db, args as { sql: string });

      case CLEAR_CACHE_TOOL.name:
        return handleClearCacheTool(db);

      case LIST_SCHEMAS_TOOL.name:
        return handleListSchemasTool(db);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
} 