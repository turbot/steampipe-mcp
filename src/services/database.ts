import { execSync } from "child_process";
import { resolve } from "path";
import { existsSync } from "fs";
import { logger } from "./logger.js";
import pg from 'pg';
import { executeCommand } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";

const { Pool } = pg;
type Pool = pg.Pool;
type PoolClient = pg.PoolClient;
type QueryResult = pg.QueryResult;

export type DatabaseSourceType = 'cli-arg' | 'steampipe';

export interface DatabaseConfig {
  connectionString: string;
  sourceType: DatabaseSourceType;
}

export interface DatabaseConnectionInfo {
  connectionString: string;
  source: string;
  sourceType: DatabaseSourceType;
}

export class DatabaseService {
  private pool: Pool | null = null;
  private client: PoolClient | null = null;
  private config: DatabaseConfig;
  private isConnecting: boolean = false;

  private constructor(config: DatabaseConfig) {
    this.config = config;
  }

  get connectionString(): string {
    return this.config.connectionString;
  }

  get sourceType(): DatabaseSourceType {
    return this.config.sourceType;
  }

  /**
   * Create a new DatabaseService instance and initialize the connection
   */
  static async create(providedConnectionString?: string): Promise<DatabaseService> {
    const connectionInfo = await DatabaseService.resolveConnection(providedConnectionString);
    logger.info(`Database connection resolved to: ${connectionInfo.connectionString}`);
    logger.info(`Database connection source type: ${connectionInfo.sourceType}`);

    const service = new DatabaseService({
      connectionString: connectionInfo.connectionString,
      sourceType: connectionInfo.sourceType
    });

    await service.initialize();
    await service.testConnection();

    return service;
  }

  /**
   * Get the database connection string to use. Priority order:
   * 1. Provided connection string argument
   * 2. Environment variable STEAMPIPE_WORKSPACE_DATABASE
   * 3. Command line argument
   * 4. Default Steampipe connection (postgresql://localhost:9193/steampipe)
   */
  private static async resolveConnection(providedConnectionString?: string): Promise<DatabaseConnectionInfo> {
    const connectionToUse = providedConnectionString || 
                           process.env.STEAMPIPE_WORKSPACE_DATABASE || 
                           (process.argv.length > 2 ? process.argv[2] : undefined) ||
                           'postgresql://steampipe@localhost:9193/steampipe';
    
    const source = providedConnectionString ? 'function argument' :
                  process.env.STEAMPIPE_WORKSPACE_DATABASE ? 'environment variable' :
                  process.argv.length > 2 ? 'command line argument' :
                  'default steampipe connection';
    
    logger.info(`Database connection provided via ${source}: ${connectionToUse}`);
    
    return {
      connectionString: connectionToUse,
      source,
      sourceType: source === 'default steampipe connection' ? 'steampipe' : 'cli-arg'
    };
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Database connection already in progress');
    }
    
    try {
      this.isConnecting = true;
      await this.connect();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Test the database connection with a simple query
   */
  async testConnection(): Promise<void> {
    try {
      logger.info("Testing database connection...");
      await this.executeQuery("SELECT 1 as test");
      logger.info("Database connection verified successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Database connection test failed:", message);
      throw error;
    }
  }

  async setDatabaseConfig(newConfig: Partial<DatabaseConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...newConfig
    };
    await this.initialize();
    await this.testConnection();
  }

  private async connect(): Promise<void> {
    // Clean up any existing connections
    await this.close();
      
    try {
      logger.debug(`Connecting to database: ${this.config.connectionString}`);
      
      const url = new URL(this.config.connectionString);
      const config: pg.PoolConfig = {
        connectionString: this.config.connectionString,
        max: 1, // We only need one client
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      // Configure SSL based on URL parameters or use secure defaults
      if (url.searchParams.has('sslmode')) {
        const sslMode = url.searchParams.get('sslmode');
        if (sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full') {
          config.ssl = { rejectUnauthorized: true };
        }
        // For other modes (disable, allow, prefer), let postgres handle it
      } else {
        // Default to prefer with self-signed certs allowed
        config.ssl = { rejectUnauthorized: false };
      }

      this.pool = new Pool(config);

      // Add error handler for connection issues
      this.pool.on('error', (err) => {
        logger.error('Unexpected database pool error:', err.message);
      });

      // Get a client from the pool
      this.client = await this.pool.connect();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      // Provide more helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Unable to connect to Steampipe database. Please ensure Steampipe is running with the command: steampipe service start');
        } else if (error.message.includes('password authentication failed')) {
          throw new Error('Database authentication failed. Please check your connection credentials.');
        } else {
          throw new Error(`Database connection failed: ${error.message}. Please ensure Steampipe is running with the command: steampipe service start`);
        }
      }
      
      logger.error(`Failed to connect to database: ${message}`);
      throw error;
    }
  }

  async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.client) {
      await this.initialize();
    }
    
    return this.runQuery(sql, params);
  }

  private async runQuery(sql: string, params: any[]): Promise<any[]> {
    if (!this.client) {
      throw new Error('No database connection available');
    }

    try {
      const result: QueryResult = await this.client.query(sql, params);
      return result.rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Query execution failed: ${message}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.release();
      this.client = null;
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}