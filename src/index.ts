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

  // Initialize database service
  const db = await DatabaseService.create();

  // Initialize server
  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools,
      prompts: promptCapabilities.prompts,
      resources: resourceCapabilities.resources,
      resourceTemplates: resourceTemplateCapabilities.resourceTemplates
    },
  });

  // Initialize handlers
  setupTools(server, db);
  setupPromptHandlers(server);
  setupResourceHandlers(server, db);
  setupResourceTemplateHandlers(server);

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(`Server started on port ${port}`);
}

// Start the server
startServer();
