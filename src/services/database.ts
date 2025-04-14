import { execSync } from "child_process";
import { resolve } from "path";
import { existsSync } from "fs";
import { logger } from "./logger.js";
import { Client, Pool, PoolClient } from 'pg';
import { executeCommand } from "../utils/command.js";
import { buildSteampipeCommand, getSteampipeEnv } from "../utils/steampipe.js";

export type DatabaseSourceType = 'steampipe' | 'connection_string' | 'unknown';

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
  private static instance: DatabaseService | null = null;
  private pool: Pool | null = null;
  private _isConnected = false;
  private _connectionString: string | null = null;
  private _sourceType: DatabaseSourceType | null = null;

  private constructor() {}

  static async create(config?: DatabaseConfig): Promise<DatabaseService> {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }

    if (config) {
      await DatabaseService.instance.reconnect(config);
    }

    return DatabaseService.instance;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get connectionString(): string | null {
    return this._connectionString;
  }

  get sourceType(): DatabaseSourceType | null {
    return this._sourceType;
  }

  /**
   * Create a new DatabaseService instance and initialize the connection
   */
  async reconnect(config: DatabaseConfig): Promise<void> {
    // Close existing connection if any
    await this.close();

    // Update config
    this._connectionString = config.connectionString;
    this._sourceType = config.sourceType;

    // Create new pool
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    await this.testConnection();
  }

  /**
   * Test the database connection with a simple query
   */
  async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('No database connection available');
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this._isConnected = true;
    } catch (error) {
      this._isConnected = false;
      throw error;
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    if (!this.pool) {
      throw new Error('No database connection available');
    }

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this._isConnected = false;
    this._connectionString = null;
    this._sourceType = null;
  }
}