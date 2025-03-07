import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DatabaseService } from "../services/database.js";
import { QUERY_TOOL, handleQueryTool } from './query.js';
import { CLEAR_CACHE_TOOL, handleClearCacheTool } from './clearCache.js';
import { INSPECT_SCHEMAS_TOOL, handleInspectSchemasTool } from './inspectSchemas.js';
import { INSPECT_TABLES_TOOL, handleInspectTablesTool } from './inspectTables.js';
import { INSPECT_COLUMNS_TOOL, handleInspectColumnsTool } from './inspectColumns.js';

export * from './query.js';
export * from './clearCache.js';
export * from './inspectSchemas.js';
export * from './inspectTables.js';
export * from './inspectColumns.js';

export function setupTools(server: Server, db: DatabaseService) {
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        QUERY_TOOL,
        CLEAR_CACHE_TOOL,
        INSPECT_SCHEMAS_TOOL,
        INSPECT_TABLES_TOOL,
        INSPECT_COLUMNS_TOOL,
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

      case INSPECT_SCHEMAS_TOOL.name:
        return handleInspectSchemasTool(db, args as { filter?: string });

      case INSPECT_TABLES_TOOL.name:
        return handleInspectTablesTool(db, args as { schema: string; filter?: string });

      case INSPECT_COLUMNS_TOOL.name:
        return handleInspectColumnsTool(db, args as { table: string; schema?: string; filter?: string });

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
} 