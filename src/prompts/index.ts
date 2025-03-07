import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { LIST_TABLES_PROMPT } from "./listTables.js";
import { BACKGROUND_PROMPT } from "./background.js";

export * from "./listTables.js";
export * from "./background.js";

export function setupPrompts(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        LIST_TABLES_PROMPT,
        BACKGROUND_PROMPT,
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === LIST_TABLES_PROMPT.name) {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "How do I see what tables are available in Steampipe?",
            },
          },
          {
            role: "assistant",
            content: LIST_TABLES_PROMPT.content[0],
          },
        ],
      };
    }

    if (name === BACKGROUND_PROMPT.name) {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "What are the best practices for writing Steampipe SQL queries?",
            },
          },
          {
            role: "assistant",
            content: BACKGROUND_PROMPT.content[0],
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });
} 