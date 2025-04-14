import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface DatabaseConnection {
  path: string;
  source: string;
  status: string;
}

export function validateAndFormat(output: string, cmd: string, resourceType: string) {
  // Just validate it's valid JSON
  const details = JSON.parse(output);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        [resourceType]: details,
        debug: {
          command: cmd
        }
      }, null, 2)
    }]
  };
}

/**
 * Formats a list result with debug information in a consistent way
 * @param data The data to format (e.g. plugins, tables, partitions)
 * @param key The key to use in the response object (e.g. "plugins", "tables", "partitions")
 * @param cmd The command that was executed
 * @returns A formatted tool response
 */
export function formatListResult<T>(data: T[], key: string, cmd: string): Promise<{
  content: Array<{
    type: string;
    text: string;
  }>;
}> {
  return Promise.resolve({
    content: [{
      type: "text",
      text: JSON.stringify({
        [key]: data,
        debug: {
          command: cmd
        }
      }, null, 2)
    }]
  });
} 