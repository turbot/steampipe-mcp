#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DatabaseService } from "./services/database.js";
import { setupTools } from "./tools/index.js";
import { setupResourceHandlers } from "./resources/index.js";
import { setupResourceTemplatesList } from "./resourceTemplates/index.js";
import { setupPrompts } from "./prompts/index.js";

const DEFAULT_DATABASE_URL = "postgres://steampipe@localhost:9193/steampipe";

const config = {
  name: "steampipe",
  version: "0.1.0",
  capabilities: {
    prompts: {},
    resources: {},
    tools: {},
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const databaseUrl = args[0] || DEFAULT_DATABASE_URL;

// Validate database URL
try {
  const url = new URL(databaseUrl);
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('Invalid database URL: must use postgres:// or postgresql:// protocol');
  }
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Invalid database URL:', error.message);
  } else {
    console.error('Invalid database URL:', error);
  }
  process.exit(1);
}

// Initialize server
const server = new Server(
  {
    name: config.name,
    version: config.version,
  },
  {
    capabilities: config.capabilities,
  },
);

// Initialize database service
let db: DatabaseService;
try {
  db = new DatabaseService(databaseUrl);
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Failed to initialize database connection:", error.message);
  } else {
    console.error("Failed to initialize database connection:", error);
  }
  process.exit(1);
}

// Set up handlers
setupTools(server, db);
setupResourceTemplatesList(server);
setupResourceHandlers(server, db);
setupPrompts(server);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  db.close().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing graceful shutdown...');
  db.close().then(() => process.exit(0));
});

// Start server
export async function runServer() {
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to start server:", error.message);
    } else {
      console.error("Failed to start server:", error);
    }
    await db.close();
    process.exit(1);
  }
}

// When run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(async (error: unknown) => {
    if (error instanceof Error) {
      console.error("Unhandled error:", error.message);
    } else {
      console.error("Unhandled error:", error);
    }
    await db.close();
    process.exit(1);
  });
}
