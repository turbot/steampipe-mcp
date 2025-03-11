import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";

export const SCHEMA_PATTERN = /^postgresql:\/\/schema\/([^\/]+)$/;

export async function handleSchemaResource(uri: string, db: DatabaseService): Promise<ReadResourceResult | undefined> {
  const match = uri.match(SCHEMA_PATTERN);
  if (!match) {
    return undefined;
  }

  const schemaName = match[1];
  const schemaInfo = await db.getSchemaInfo(schemaName);
  
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(schemaInfo, null, 2),
      },
    ],
  };
} 