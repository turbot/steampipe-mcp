import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { executeCommand, formatCommandError } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";
import { validateAndFormat } from "../utils/format.js";

export const tool: Tool = {
  name: "source_show",
  description: "Get details for a specific Steampipe source.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the source to show details for"
      }
    },
    required: ["name"],
    additionalProperties: false
  },
  handler: async (args: { name: string }) => {
    logger.debug('Executing source_show tool');
    const cmd = buildSteampipeCommand(`source show ${args.name}`, { output: 'json' });
    
    try {
      const output = executeCommand(cmd, { env: getSteampipeEnv() });
      return validateAndFormat(output, cmd, 'source');
    } catch (error) {
      logger.error('Failed to execute source_show tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, cmd);
    }
  }
}; 