import type { ResourceTemplate as MCPResourceTemplate } from "@modelcontextprotocol/sdk/types.js";

export interface ResourceTemplate extends MCPResourceTemplate {
  name: string;
  description: string;
  uri: string;
  type: string;
} 