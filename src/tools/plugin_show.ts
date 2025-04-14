import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { executeCommand, formatCommandError } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";
import { validateAndFormat } from "../utils/format.js";

export const tool: Tool = {
  name: "plugin_show",
  description: "Get details for a specific Tailpipe plugin installation.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the plugin to show details for"
      }
    },
    required: ["name"],
    additionalProperties: false
  },
  handler: async (args: { name: string }) => {
    logger.debug('Executing plugin_show tool');
    const cmd = buildSteampipeCommand(`plugin show ${args.name}`, { output: 'json' });
    
    try {
      const output = executeCommand(cmd, { env: getSteampipeEnv() });
      return validateAndFormat(output, cmd, 'plugin');
    } catch (error) {
      logger.error('Failed to execute plugin_show tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, cmd);
    }
  }
}; 