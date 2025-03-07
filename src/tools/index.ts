import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DatabaseService } from "../services/database.js";
import { QUERY_TOOL, handleQueryTool } from './query.js';
import { CLEAR_CACHE_TOOL, handleClearCacheTool } from './clearCache.js';
import { LIST_SCHEMAS_TOOL, handleListSchemasTool } from './listSchemas.js';
import { LIST_TABLES_TOOL, handleListTablesTool } from './listTables.js';
import { LIST_COLUMNS_TOOL, handleListColumnsTool } from './listColumns.js';

export * from './query.js';
export * from './clearCache.js';
export * from './listSchemas.js';
export * from './listTables.js';
export * from './listColumns.js';

export function setupTools(server: Server, db: DatabaseService) {
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        QUERY_TOOL,
        CLEAR_CACHE_TOOL,
        LIST_SCHEMAS_TOOL,
        LIST_TABLES_TOOL,
        LIST_COLUMNS_TOOL,
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

      case LIST_TABLES_TOOL.name:
        return handleListTablesTool(db, args as { schema: string });

      case LIST_COLUMNS_TOOL.name:
        return handleListColumnsTool(db, args as { table: string; schema?: string });

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
} 