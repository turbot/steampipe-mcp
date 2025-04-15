import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest, type Tool, type ServerResult } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";
import AjvModule from "ajv";
import { logger } from "../services/logger.js";

// Define tool handler types
type DbToolHandler = (args: any, db: DatabaseService) => Promise<ServerResult>;
type StandardToolHandler = (args: any) => Promise<ServerResult>;

// Database Operations
import { tool as queryTool } from './query_steampipe.js';

// Data Structure Operations
import { tool as tableListTool } from './table_list.js';
import { tool as tableShowTool } from './table_show.js';

// Plugin Operations
import { tool as pluginListTool } from './plugin_list.js';
import { tool as pluginShowTool } from './plugin_show.js';

// Initialize JSON Schema validator
const Ajv = AjvModule.default || AjvModule;
const ajv = new Ajv();

// Export all tools for server capabilities
export const tools = {
  // Database Operations
  query_steampipe: queryTool,          // Core database query functionality

  // Data Structure Operations
  table_list: tableListTool,         // List available tables
  table_show: tableShowTool,         // Show table details

  // Plugin Operations
  plugin_list: pluginListTool,       // List available plugins
  plugin_show: pluginShowTool,       // Show plugin details
} as const;

// Initialize tool handlers
export function setupTools(server: Server, db: DatabaseService) {
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args = {} } = request.params;
      const tool = tools[name as keyof typeof tools];

      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      if (!tool.handler) {
        throw new Error(`Tool ${name} has no handler defined`);
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

      // Pass database instance to database-dependent tools
      if (name === 'query_steampipe' || name === 'table_list' || name === 'table_show') {
        const dbHandler = tool.handler as DbToolHandler;
        return await dbHandler(args, db);
      }

      // Standard tool handling
      const standardHandler = tool.handler as StandardToolHandler;
      return await standardHandler(args);
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