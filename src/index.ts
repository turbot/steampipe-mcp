#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DatabaseService } from "./services/database.js";
import { setupTools } from "./tools/index.js";
import { setupPrompts } from "./prompts/index.js";

const DEFAULT_DATABASE_URL = "postgresql://steampipe@localhost:9193/steampipe";

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

// Initialize server
const server = new Server(
  {
    name: "steampipe",
    version: "0.1.0",
    description: "Exploring and query Steampipe data. Provides tools to browse schemas, inspect tables, and execute read-only SQL queries against your Steampipe database.",
    vendor: "Turbot HQ, Inc",
    homepage: "https://github.com/turbot/steampipe-mcp",
  },
  {
    capabilities: {
      prompts: {},
      tools: {},
      resources: {},
    },
  },
);

// Set up handlers
setupTools(server, db);
setupPrompts(server);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  db.close().finally(() => process.exit(1));
});
