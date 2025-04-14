import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../services/logger.js";
import { executeCommand, formatCommandError } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";
import { validateAndFormat } from "../utils/format.js";

export const tool: Tool = {
  name: "partition_show",
  description: "Get details for a specific Tailpipe partition.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" }
    },
    required: ["name"],
    additionalProperties: false
  },
  handler: async (args: { name: string }) => {
    logger.debug('Executing partition_show tool');
    const cmd = buildSteampipeCommand(`partition show "${args.name}"`, { output: 'json' });
    
    try {
      const output = executeCommand(cmd, { env: getSteampipeEnv() });
      return validateAndFormat(output, cmd, 'partition');
    } catch (error) {
      logger.error('Failed to execute partition_show tool:', error instanceof Error ? error.message : String(error));
      return formatCommandError(error, cmd);
    }
  }
}; 