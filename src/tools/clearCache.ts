import { DatabaseService } from "../services/database.js";

export const CLEAR_CACHE_TOOL = {
  name: "clear_cache",
  description: "Clear the Steampipe cache",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleClearCacheTool(db: DatabaseService) {
  await db.executeWriteQuery("select from steampipe_internal.meta_cache('clear')");
  return {
    content: [{ type: "text", text: "Cache cleared successfully" }],
    isError: false,
  };
} 