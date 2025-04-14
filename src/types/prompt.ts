import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";

export interface Prompt {
  name: string;
  description: string;
  handler: () => Promise<GetPromptResult>;
} 