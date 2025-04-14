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

// Parse command line arguments for database path
const args = process.argv.slice(2);
const providedDatabasePath = args[0] || process.env.TAILPIPE_MCP_DATABASE_PATH;

// Track server start time
let serverStartTime: string;

// Handle graceful shutdown
// NOTE: we cannot do any logging here! doing so causes the MCP inspector
// to crash when you refresh the browser, assumedly because we get an
// invalid message format sent over the wire to it from this MCP server.
// I couldn't use logger.{debug,info,error} at all, and it took ages to
// find the cause of the crash.
function setupShutdownHandlers(db: DatabaseService) {
  const gracefulShutdown = async () => {
    if (db) {
      try {
        await db.close();
      } catch (error) {
        logger.error(`Error closing database: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    process.exit(0);
  };
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Start server
async function startServer() {
  try {
    logger.info("Starting MCP server...");
    
    // Record start time
    serverStartTime = new Date().toISOString();
    
    // Create MCP server
    const server = new Server(
      SERVER_INFO,
      {
        capabilities: {
          tools,
          prompts: promptCapabilities.prompts,
          resources: resourceCapabilities.resources,
          resourceTemplates: resourceTemplateCapabilities.resourceTemplates
        }
      }
    );
    
    // Initialize database connection
    const db = await DatabaseService.create(providedDatabasePath);
    logger.info("Database connection initialized successfully");
    
    // Set up shutdown handlers
    logger.info("Setting up shutdown handlers...");
    setupShutdownHandlers(db);
    logger.info("Shutdown handlers configured");

    logger.info(`Server started at: ${serverStartTime}`);

    // Set up handlers
    logger.info("Configuring server handlers...");
    setupTools(server, db);
    setupPromptHandlers(server);
    setupResourceHandlers(server, db);
    setupResourceTemplateHandlers(server);
    logger.info("Server handlers configured");

    // Connect transport
    logger.info("Initializing transport connection...");
    const transport = new StdioServerTransport();

    // Connect to transport and handle any errors
    try {
      await server.connect(transport);
      logger.info("Transport connection established");
    } catch (error) {
      logger.error(`Failed to connect transport: ${error instanceof Error ? error.message : String(error)}`);
      // Don't crash the process, just log the error
    }
    
    logger.info("MCP server started successfully");
  } catch (error: unknown) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

startServer();

// Export for use in other modules
export function getServerStartTime(): string {
  return serverStartTime;
}
