import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest, type Tool, type ServerResult } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";
import AjvModule from "ajv";
import { logger } from "../services/logger.js";

// Import tools
import { tool as queryTool } from './query_steampipe.js';
import { tool as tableListTool } from './table_list.js';
import { tool as tableShowTool } from './table_show.js';
import { tool as pluginListTool } from './plugin_list.js';
import { tool as pluginShowTool } from './plugin_show.js';

// Initialize JSON Schema validator
const Ajv = AjvModule.default || AjvModule;
const ajv = new Ajv();

// Define tool types
type DbTool = Tool & {
  handler: (db: DatabaseService, args: any) => Promise<ServerResult>;
};

type StandardTool = Tool & {
  handler: (args: any) => Promise<ServerResult>;
};

// Export all tools for server capabilities
export const tools = {
  query_steampipe: queryTool as DbTool,
  table_list: tableListTool as DbTool,
  table_show: tableShowTool as DbTool,
  plugin_list: pluginListTool as StandardTool,
  plugin_show: pluginShowTool as StandardTool,
} as const;

// Initialize tool handlers
export function setupTools(server: Server, db: DatabaseService) {
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { 
      tools: Object.entries(tools).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args = {} } = request.params;
      const tool = tools[name as keyof typeof tools];

      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Validate arguments against the tool's schema
      if (tool.inputSchema) {
        const validate = ajv.compile(tool.inputSchema);
        if (!validate(args)) {
          logger.error(`Invalid arguments for tool ${name}:`, validate.errors);
          
          // Format validation errors in a user-friendly way
          const errors = validate.errors || [];
          const errorMessages = errors.map(err => {
            const path = err.instancePath.replace(/^\//, '') || 'input';
            switch (err.keyword) {
              case 'required':
                return `Missing required field: ${err.params.missingProperty}`;
              case 'type':
                return `${path} must be a ${err.params.type}`;
              case 'enum':
                return `${path} must be one of: ${err.params.allowedValues?.join(', ')}`;
              case 'additionalProperties':
                return `Unexpected field: ${err.params.additionalProperty}`;
              default:
                return `${path}: ${err.message}`;
            }
          });

          return {
            content: [{
              type: "text",
              text: errorMessages.join('\n')
            }],
            isError: true
          };
        }
      }

      // Call the tool handler with database for db tools
      if (name === 'query_steampipe' || name === 'table_list' || name === 'table_show') {
        return await (tool as DbTool).handler(db, args);
      }

      return await (tool as StandardTool).handler(args);
    } catch (error) {
      logger.error('Error executing tool:', error);
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : 'An unknown error occurred'
        }],
        isError: true
      };
    }
  });
} 