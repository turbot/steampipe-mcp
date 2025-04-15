#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DatabaseService } from "./services/database.js";
import { setupTools, tools } from "./tools/index.js";
import { setupPromptHandlers, promptCapabilities } from "./prompts/index.js";
import { setupResourceHandlers, resourceCapabilities } from "./resources/index.js";
import { setupResourceTemplateHandlers, resourceTemplateCapabilities } from "./resourceTemplates/index.js";
import { logger } from "./services/logger.js";

// Import package.json
import pkg from '../package.json' assert { type: 'json' };

// Server metadata
const SERVER_INFO = {
  name: pkg.name.replace('@turbot/', ''),
  version: pkg.version,
  description: pkg.description,
  vendor: pkg.author,
  license: pkg.license,
  homepage: pkg.homepage,
} as const;

let serverStartTime: Date;

// Handle graceful shutdown
function setupShutdownHandlers(db: DatabaseService) {
  const gracefulShutdown = async () => {
    if (db) {
      try {
        await db.close();
      } catch (error) {
        // Note: Avoid logging during shutdown as it may interfere with MCP protocol
        process.exit(1);
      }
    }
    process.exit(0);
  };
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

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

    // Set up shutdown handlers
    setupShutdownHandlers(db);
    logger.info('Shutdown handlers configured');

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
