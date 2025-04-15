import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { GetPromptRequestSchema, ListPromptsRequestSchema, type Prompt } from "@modelcontextprotocol/sdk/types.js";
import { prompt as bestPracticesPrompt } from "./best_practices.js";
import { logger } from "../services/logger.js";

// Register all available prompts
const prompts = [bestPracticesPrompt];

// Export prompts for server capabilities
export const promptCapabilities = {
  prompts: Object.fromEntries(
    prompts.map(p => [p.name, {
      name: p.name,
      description: p.description
    }])
  )
};

export function setupPromptHandlers(server: Server) {
  // Register prompt list handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    try {
      return { prompts: Object.values(promptCapabilities.prompts) };
    } catch (error) {
      // Log the error but don't fail - return default prompts
      if (error instanceof Error) {
        logger.error("Critical error listing prompts:", error.message);
      } else {
        logger.error("Critical error listing prompts:", error);
      }
      
      // Return empty list on error
      return { prompts: [] };
    }
  });

  // Register prompt get handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    // Find matching prompt
    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    // Handle the prompt request
    return prompt.handler();
  });
} 