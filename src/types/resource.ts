import { DatabaseService } from "../services/database.js";

export interface Resource {
  uri: string;
  name: string;
  type: string;
  description: string;
  handler: (db: DatabaseService) => Promise<{
    contents: Array<{
      uri: string;
      mimeType: string;
      text: string;
    }>;
  }>;
} 