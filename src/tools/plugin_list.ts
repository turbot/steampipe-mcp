import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { executeCommand, formatCommandError } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";
import { formatListResult } from "../utils/format.js";

interface Plugin {
  Name: string;
  Partitions: string[] | null;
  Version: string;
}

function parsePlugins(output: string): Plugin[] {
  const rawPlugins = JSON.parse(output);
  if (!Array.isArray(rawPlugins)) {
    throw new Error('Expected array output from Tailpipe CLI');
  }

  return rawPlugins.map(plugin => ({
    Name: plugin.Name || '',
    Partitions: Array.isArray(plugin.Partitions) ? plugin.Partitions : null,
    Version: plugin.Version || ''
  }));
}

export const tool: Tool = {
  name: "plugin_list",
  description: "List all Tailpipe plugins installed on the system.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  handler: async () => {
    logger.debug('Executing plugin_list tool');
    const cmd = buildSteampipeCommand('plugin list', { output: 'json' });
    
    try {
      const output = executeCommand(cmd, { env: getSteampipeEnv() });
      const plugins = parsePlugins(output);
      return formatListResult(plugins, 'plugins', cmd);
    } catch (error) {
      logger.error('Failed to execute plugin_list tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, cmd);
    }
  }
}; 