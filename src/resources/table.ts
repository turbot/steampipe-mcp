import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";

export const TABLE_PATTERN = /^postgres:\/\/table\/([^\/]+)\/([^\/]+)$/;

export async function handleTableResource(uri: string, db: DatabaseService): Promise<ReadResourceResult | undefined> {
  const match = uri.match(TABLE_PATTERN);
  if (!match) {
    return undefined;
  }

  const [schemaName, tableName] = [match[1], match[2]];
  const tableInfo = await db.getTableInfo(schemaName, tableName);

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(tableInfo, null, 2),
      },
    ],
  };
} 