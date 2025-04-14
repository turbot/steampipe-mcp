import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest, type Tool, type ServerResult } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";

// Database Operations
import { tool as queryTool } from './query_steampipe.js';
import { tool as reconnectTool } from './reconnect_steampipe.js';

// Data Structure Operations
import { tool as tableListTool } from './table_list.js';
import { tool as tableShowTool } from './table_show.js';

// Plugin Operations
import { tool as pluginListTool } from './plugin_list.js';
import { tool as pluginShowTool } from './plugin_show.js';

// Export all tools for server capabilities
export const tools = {
  // Database Operations
  query_steampipe: queryTool,          // Core database query functionality
  reconnect_steampipe: reconnectTool,  // Database connection management

  // Data Structure Operations
  table_list: tableListTool,         // List available tables
  table_show: tableShowTool,         // Show table details

  // Plugin Operations
  plugin_list: pluginListTool,       // List available plugins
  plugin_show: pluginShowTool,       // Show plugin details
};

// Initialize tool handlers
export function setupTools(server: Server, db: DatabaseService) {
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.values(tools),
    };
  });

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;
    const tool = tools[name as keyof typeof tools];

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    if (!tool.handler) {
      throw new Error(`Tool ${name} has no handler defined`);
    }

    // Pass database instance to database-dependent tools
    if (name === 'query_steampipe' || name === 'reconnect_steampipe' || 
        name === 'table_list' || name === 'table_show') {
      return await (tool.handler as (db: DatabaseService, args: unknown) => Promise<ServerResult>)(db, args || {});
    }

    // Standard tool handling
    return await (tool.handler as (args: unknown) => Promise<ServerResult>)(args || {});
  });
} 