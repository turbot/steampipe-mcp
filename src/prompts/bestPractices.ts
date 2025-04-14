import type { Prompt } from "@modelcontextprotocol/sdk/types.js";

type PromptHandler = () => Promise<{ content: Array<{ type: string; text: string }> }>;

export const prompt: Prompt & { handler: PromptHandler } = {
  name: "list_tables",
  description: "List available tables in the database",
  handler: async () => {
    return {
      content: [{
        type: "text",
        text: `To list available tables, you can:

1. Use the \`table_list\` tool to see all tables
2. Use the \`table_show\` tool to get details about a specific table
3. Use the \`query_steampipe\` tool with SQL queries like:
   - \`SELECT * FROM information_schema.tables\`
   - \`SELECT table_schema, table_name FROM information_schema.tables\`
`
      }]
    };
  }
}; 