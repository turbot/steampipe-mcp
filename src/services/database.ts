import { execSync } from "child_process";
import { resolve } from "path";
import { existsSync } from "fs";
import { logger } from "./logger.js";
import pkg from 'pg';
const { Client, Pool } = pkg;
import type { Pool as PoolType, PoolClient } from 'pg';

export interface DatabaseConfig {
  connectionString: string;
}

export interface DatabaseConnectionInfo {
  connectionString: string;
}

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private pool: PoolType | null = null;
  private _isConnected = false;
  private _connectionString: string | null = null;
  private config: DatabaseConfig;

  /**
   * Sanitize a connection string by removing sensitive information
   */
  private sanitizeConnectionString(connectionString: string): string {
    try {
      // Create URL object to parse connection string
      const url = new URL(connectionString);
      // Remove password if present
      url.password = url.password ? '****' : '';
      return url.toString();
    } catch (e) {
      // If URL parsing fails, do basic sanitization
      return connectionString.replace(/:[^:@]+@/, ':****@');
    }
  }

  private constructor() {
    // Set default config
    this.config = {
      connectionString: process.env.STEAMPIPE_MCP_WORKSPACE_DATABASE || 'postgresql://steampipe@localhost:9193/steampipe'
    };
  }

  private setupPoolErrorHandlers(pool: PoolType) {
    // Handle pool errors to prevent crashes
    pool.on('error', (err) => {
      logger.error('Unexpected pool error:', err);
      // Reset connection state since the pool is now invalid
      this._isConnected = false;
      this._connectionString = null;
      this.pool = null;
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get connectionString(): string | null {
    return this._connectionString;
  }

  get configConnectionString(): string {
    return this.config.connectionString;
  }

  /**
   * Update the connection configuration
   */
  setConfig(config: DatabaseConfig): void {
    this.config = config;
    // Reset connection state since config changed
    this._isConnected = false;
    this._connectionString = null;
    if (this.pool) {
      // Close existing connection if any
      this.pool.end().catch(err => {
        logger.error('Error closing pool:', err);
      });
      this.pool = null;
    }
  }

  /**
   * Ensure we have a connection pool and it's working
   */
  private async ensureConnection(): Promise<void> {
    if (this._isConnected && this.pool) {
      return;
    }

    // Close any existing pool
    if (this.pool) {
      await this.pool.end().catch(err => {
        logger.error('Error closing pool:', err);
      });
      this.pool = null;
    }

    try {
      logger.debug('Attempting database connection to:', this.sanitizeConnectionString(this.config.connectionString));
      
      // Parse connection string to handle SSL configuration
      const url = new URL(this.config.connectionString);
      const poolConfig: any = {
        connectionString: this.config.connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxLifetimeSeconds: 300  // 5 minutes
      };

      // Configure SSL based on URL parameters or use secure defaults
      if (url.searchParams.has('sslmode')) {
        const sslMode = url.searchParams.get('sslmode');
        if (sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full') {
          poolConfig.ssl = { rejectUnauthorized: true };
        }
        // For other modes (disable, allow, prefer), let postgres handle it
      } else {
        // Default to prefer with self-signed certs allowed
        poolConfig.ssl = { rejectUnauthorized: false };
      }

      // Create new pool
      this.pool = new Pool(poolConfig);

      // Set up error handlers for the pool
      this.setupPoolErrorHandlers(this.pool);

      // Set statement timeout on connection and verify it's working
      const client = await this.pool.connect();
      await client.query('SET statement_timeout = 120000'); // 120 seconds
      await client.query('SELECT 1'); // Verify connection
      client.release();
      
      this._isConnected = true;
      this._connectionString = this.config.connectionString;
      logger.debug('Successfully connected to database');
    } catch (error) {
      this._isConnected = false;
      this._connectionString = null;
      if (this.pool) {
        await this.pool.end().catch(err => {
          logger.error('Error closing pool during error handling:', err);
        });
        this.pool = null;
      }

      // Log the raw error for debugging
      logger.debug('Database connection error:', error);

      // Check for termination error
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        const code = (error as any).code;
        const safeConnString = this.sanitizeConnectionString(this.config.connectionString);

        // Handle termination errors
        if (code === '57P01' || msg.includes('terminating connection due to administrator command')) {
          throw new Error(`Database connection terminated - Steampipe service may have been stopped. Please ensure Steampipe is running at ${safeConnString}`);
        }
        
        // Handle common postgres error codes
        if (code === 'ECONNREFUSED') {
          throw new Error(`Cannot connect to Steampipe database at ${safeConnString}. Please ensure Steampipe is running (e.g. 'steampipe service start').`);
        }
        if (code === '28P01') {
          throw new Error(`Database authentication failed for ${safeConnString}. Please check your credentials.`);
        }
        if (code === '3D000') {
          throw new Error(`Database does not exist at ${safeConnString}. Please check your connection string.`);
        }
        if (code === '28000') {
          throw new Error(`Database user/role does not exist for ${safeConnString}. Please check your credentials.`);
        }
        if (code === '57P03') {
          throw new Error(`Database connection timed out for ${safeConnString}. The server might be overloaded or unreachable.`);
        }

        // Handle common error message patterns
        if (msg.includes('econnrefused') || msg.includes('connect refused')) {
          throw new Error(`Cannot connect to Steampipe database at ${safeConnString}. Please ensure Steampipe is running (e.g. 'steampipe service start').`);
        }
        if (msg.includes('password authentication failed')) {
          throw new Error(`Database authentication failed for ${safeConnString}. Please check your credentials.`);
        }
        if (msg.includes('database') && msg.includes('does not exist')) {
          throw new Error(`Database does not exist at ${safeConnString}. Please check your connection string.`);
        }
        if (msg.includes('role') && msg.includes('does not exist')) {
          throw new Error(`Database user/role does not exist for ${safeConnString}. Please check your credentials.`);
        }
        if (msg.includes('timeout')) {
          throw new Error(`Database connection timed out for ${safeConnString}. The server might be overloaded or unreachable.`);
        }

        // For other errors, include the specific error message
        throw new Error(`Database connection failed for ${safeConnString}: ${error.message}`);
      }
      throw new Error(`Database connection failed for ${this.sanitizeConnectionString(this.config.connectionString)}: ${String(error)}`);
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      await this.ensureConnection();
      
      if (!this.pool) {
        throw new Error('No database connection available');
      }

      // Get a client from the pool
      const client = await this.pool.connect();
      
      try {
        // Start a read-only transaction
        await client.query('BEGIN TRANSACTION READ ONLY');
        
        // Execute the query within the transaction
        const result = await client.query(query, params);
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return result.rows;
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK').catch(rollbackError => {
          logger.error('Error rolling back transaction:', rollbackError);
        });
        throw error;
      } finally {
        // Always release the client back to the pool
        client.release();
      }
    } catch (error) {
      // Enhance query error messages
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('syntax error')) {
          throw new Error(`SQL syntax error: ${error.message}`);
        }
        if (msg.includes('permission denied')) {
          throw new Error(`Permission denied: ${error.message}`);
        }
        if (msg.includes('relation') && msg.includes('does not exist')) {
          throw new Error(`Table or view not found: ${error.message}`);
        }
        // Pass through the original error instead of masking it
        throw error;
      }
      // If it's not an Error instance, convert to string but preserve the message
      throw new Error(`Query execution failed: ${String(error)}`);
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this._isConnected = false;
    this._connectionString = null;
  }
}