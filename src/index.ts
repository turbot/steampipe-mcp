#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DatabaseService } from "./services/database.js";
import { setupTools, tools } from "./tools/index.js";
import { setupPromptHandlers, promptCapabilities } from "./prompts/index.js";
import { setupResourceHandlers, resourceCapabilities } from "./resources/index.js";
import { setupResourceTemplateHandlers, resourceTemplateCapabilities } from "./resourceTemplates/index.js";
import { logger } from "./services/logger.js";

// Server metadata
const SERVER_INFO = {
  name: "steampipe",
  version: "0.1.0",
  description: "Use Steampipe to explore and query your cloud and security logs with SQL.",
  license: "Apache-2.0",
  homepage: "https://github.com/turbot/steampipe-mcp",
} as const;

let serverStartTime: Date;

export function getServerStartTime(): Date {
  return serverStartTime;
}

export async function startServer(port: number = 27123) {
  serverStartTime = new Date();
  logger.info(`Starting server on port ${port}`);

  try {
    // Get database service instance (but don't connect yet)
    const db = DatabaseService.getInstance();

    // Set connection string from command line if provided
    const connectionString = process.argv[2];
    if (connectionString) {
      db.setConfig({
        connectionString
      });
      logger.info('Using connection string from command line argument');
    }

    // Initialize server
    logger.info('Creating MCP server instance...');
    const serverStartTime = Date.now();
    const server = new Server(SERVER_INFO, {
      capabilities: {
        tools,
        prompts: promptCapabilities.prompts,
        resources: resourceCapabilities.resources,
        resourceTemplates: resourceTemplateCapabilities.resourceTemplates
      },
    });
    logger.info(`MCP server instance created (took ${Date.now() - serverStartTime}ms)`);

    // Initialize handlers
    logger.info('Setting up handlers...');
    const handlersStartTime = Date.now();
    setupTools(server, db);
    logger.info('Tools handlers initialized');
    setupPromptHandlers(server);
    logger.info('Prompt handlers initialized');
    setupResourceHandlers(server, db);
    logger.info('Resource handlers initialized');
    setupResourceTemplateHandlers(server);
    logger.info(`All handlers initialized successfully (took ${Date.now() - handlersStartTime}ms)`);

    // Connect transport
    logger.info('Connecting transport...');
    const transportStartTime = Date.now();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info(`Transport connected successfully (took ${Date.now() - transportStartTime}ms)`);

    const totalTime = Date.now() - serverStartTime;
    logger.info(`Server started successfully on port ${port} (total initialization time: ${totalTime}ms)`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    throw error;
  }
}

// Start the server
startServer();
