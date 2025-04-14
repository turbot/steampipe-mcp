import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { executeCommand, formatCommandError } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";
import { formatListResult } from "../utils/format.js";

interface Table {
  name: string;
  description?: string;
  local: {
    file_count: number;
    file_size: number;
  };
  plugin: string;
}

function parseTables(output: string): Table[] {
  const rawTables = JSON.parse(output);
  if (!Array.isArray(rawTables)) {
    throw new Error('Expected array output from Tailpipe CLI');
  }

  return rawTables.map(table => ({
    name: table.name || '',
    ...(table.description && { description: table.description }),
    local: {
      file_count: table.local?.file_count || 0,
      file_size: table.local?.file_size || 0
    },
    plugin: table.plugin || ''
  }));
}

export const tool: Tool = {
  name: "table_list",
  description: "List all available Tailpipe tables.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  handler: async () => {
    logger.debug('Executing table_list tool');
    const cmd = buildSteampipeCommand('table list', { output: 'json' });
    
    try {
      const output = executeCommand(cmd, { env: getSteampipeEnv() });
      const tables = parseTables(output);
      return formatListResult(tables, 'tables', cmd);
    } catch (error) {
      logger.error('Failed to execute table_list tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, cmd);
    }
  }
}; 