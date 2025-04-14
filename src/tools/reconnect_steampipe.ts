import { DatabaseService } from '../services/database.js';
import { logger } from '../services/logger.js';

export const description = 'Reconnect to the Steampipe database, optionally using a new connection string.';

export const inputSchema = {
  type: 'object',
  properties: {
    connection_string: {
      type: 'string',
      description: 'Optional new connection string to connect to',
    },
  },
  additionalProperties: false,
} as const;

export async function handler(args?: { connection_string?: string }) {
  const db = await DatabaseService.create();

  try {
    if (args?.connection_string) {
      // Reconnect with new connection string
      await db.reconnect({
        connectionString: args.connection_string,
        sourceType: 'connection_string',
      });
      logger.info(`Successfully reconnected to database with new connection string: ${args.connection_string}`);
    } else {
      // Test current connection
      await db.testConnection();
      logger.info('Successfully tested current database connection');
    }

    return {
      connection_string: db.connectionString,
      source_type: db.sourceType,
      is_connected: db.isConnected,
    };
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}