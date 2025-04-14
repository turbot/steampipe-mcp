import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { executeCommand, formatCommandError } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";
import { formatListResult } from "../utils/format.js";

interface Partition {
  name: string;
  description?: string;
  local: {
    file_count: number;
    file_size: number;
  };
  plugin: string;
}

function parsePartitions(output: string): Partition[] {
  const rawPartitions = JSON.parse(output);
  if (!Array.isArray(rawPartitions)) {
    throw new Error('Expected array output from Tailpipe CLI');
  }

  return rawPartitions.map(partition => ({
    name: partition.name || '',
    ...(partition.description && { description: partition.description }),
    local: {
      file_count: partition.local?.file_count || 0,
      file_size: partition.local?.file_size || 0
    },
    plugin: partition.plugin || ''
  }));
}

export const tool: Tool = {
  name: "partition_list",
  description: `List all Tailpipe partitions with simple statistics.`,
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  handler: async () => {
    logger.debug('Executing partition_list tool');
    const cmd = buildSteampipeCommand('partition list', { output: 'json' });
    
    try {
      const output = executeCommand(cmd, { env: getSteampipeEnv() });
      const partitions = parsePartitions(output);
      return formatListResult(partitions, 'partitions', cmd);
    } catch (error) {
      logger.error('Failed to execute partition_list tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, cmd);
    }
  }
}; 