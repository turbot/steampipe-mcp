import { ListPromptsRequestSchema, GetPromptRequestSchema, Prompt } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PromptName } from "../types/index.js";

export const LIST_TABLES_PROMPT = {
  name: PromptName.LIST_TABLES,
  description: "Get help with querying Steampipe for a list of available tables",
  content: [
    {
      type: "text",
      text: "To see all available tables in Steampipe, you can run this SQL query:\n\nSELECT table_schema, table_name\nFROM information_schema.tables\nWHERE table_schema NOT IN ('information_schema', 'pg_catalog');\n\nThis will show you all the tables across all installed plugins. The table_schema typically corresponds to the plugin name (e.g., 'aws', 'github', etc.)."
    }
  ]
} satisfies Prompt;

export function setupListTablesPrompt(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        LIST_TABLES_PROMPT,
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === PromptName.LIST_TABLES) {
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

    throw new Error(`Unknown prompt: ${name}`);
  });
} 