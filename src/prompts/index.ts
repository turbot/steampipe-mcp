import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { BACKGROUND_PROMPT, handleBackgroundPrompt } from "./background.js";

export function setupPrompts(server: Server) {
  // Register prompt list handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [BACKGROUND_PROMPT],
    };
  });

  // Register prompt get handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    switch (name) {
      case BACKGROUND_PROMPT.name:
        return handleBackgroundPrompt();

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
} 