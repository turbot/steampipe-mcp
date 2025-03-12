import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { BEST_PRACTICES_PROMPT, handleBestPracticesPrompt } from "./bestPractices.js";

export function setupPrompts(server: Server) {
  // Register prompt list handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [BEST_PRACTICES_PROMPT],
    };
  });

  // Register prompt get handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    switch (name) {
      case BEST_PRACTICES_PROMPT.name:
        return handleBestPracticesPrompt();

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
} 