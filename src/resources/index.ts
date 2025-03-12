import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { DatabaseService } from "../services/database.js";
import { handleSchemaResource, SCHEMA_PATTERN } from "./schema.js";
import { handleTableResource, TABLE_PATTERN } from "./table.js";

export async function handleResource(uri: string, db: DatabaseService): Promise<ReadResourceResult | undefined> {
  if (uri.match(SCHEMA_PATTERN)) {
    return handleSchemaResource(uri, db);
  }
  if (uri.match(TABLE_PATTERN)) {
    return handleTableResource(uri, db);
  }
  return undefined;
} 