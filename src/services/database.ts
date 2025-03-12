import pg from "pg";
import { SchemaInfo, TableInfo } from "../types/index.js";

export class DatabaseService {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    const url = new URL(connectionString);
    
    const config: pg.PoolConfig = {
      connectionString,
      max: 20,
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

    this.pool = new pg.Pool(config);

    // Add error handler for connection issues
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err.message);
    });
  }

  private async ensureConnection() {
    try {
      const client = await this.pool.connect();
      client.release();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Unable to connect to Steampipe database. Please ensure Steampipe is running with the command: steampipe service start');
        } else if (error.message.includes('password authentication failed')) {
          throw new Error('Database authentication failed. Please check your connection credentials.');
        } else {
          throw new Error(`Database connection failed: ${error.message}. Please ensure Steampipe is running with the command: steampipe service start`);
        }
      }
      throw error;
    }
  }

  async getSchemaInfo(schemaName: string): Promise<SchemaInfo> {
    const result = await this.executeQueryWithTransaction(
      `SELECT 
         t.table_name, 
         t.table_type,
         pg_catalog.obj_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, 'pg_class') as description
       FROM information_schema.tables t
       WHERE t.table_schema = $1 
       AND t.table_schema NOT IN ('information_schema', 'pg_catalog')`,
      [schemaName]
    );

    if (result.length === 0) {
      throw new Error(`Schema not found: ${schemaName}`);
    }

    return {
      schema: schemaName,
      tables: result.map(row => ({
        name: row.table_name,
        type: row.table_type,
        description: row.description,
      })),
    };
  }

  async getTableInfo(schemaName: string, tableName: string): Promise<TableInfo> {
    // First check if the schema exists
    const schemaResult = await this.executeQueryWithTransaction(
      `SELECT 1 
       FROM information_schema.schemata 
       WHERE schema_name = $1 
       AND schema_name NOT IN ('information_schema', 'pg_catalog')`,
      [schemaName]
    );

    if (schemaResult.length === 0) {
      throw new Error(`Schema not found: ${schemaName}`);
    }

    // Get table info and columns in a single transaction
    const [tableResult, columnResult] = await Promise.all([
      this.executeQueryWithTransaction(
        `SELECT pg_catalog.obj_description((quote_ident($1) || '.' || quote_ident($2))::regclass::oid, 'pg_class') as description`,
        [schemaName, tableName]
      ),
      this.executeQueryWithTransaction(
        `SELECT 
           c.column_name,
           c.data_type,
           pg_catalog.col_description((quote_ident($1) || '.' || quote_ident($2))::regclass::oid, c.ordinal_position) as description
         FROM information_schema.columns c
         WHERE c.table_schema = $1 AND c.table_name = $2
         ORDER BY c.ordinal_position`,
        [schemaName, tableName]
      )
    ]);

    if (columnResult.length === 0) {
      throw new Error(`Table not found: ${tableName} in schema ${schemaName}`);
    }

    return {
      schema: schemaName,
      table: tableName,
      description: tableResult[0]?.description,
      columns: columnResult.map(row => ({
        name: row.column_name,
        type: row.data_type,
        description: row.description,
      })),
    };
  }

  private async executeQueryWithTransaction(sql: string, params?: any[], readOnly: boolean = true): Promise<any[]> {
    await this.ensureConnection();
    const client = await this.pool.connect();
    try {
      await client.query(readOnly ? "BEGIN TRANSACTION READ ONLY" : "BEGIN TRANSACTION");
      const result = await client.query(sql, params);
      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK').catch(() => {});
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    return this.executeQueryWithTransaction(sql, params, true);
  }

  async executeWriteQuery(sql: string, params?: any[]): Promise<any[]> {
    return this.executeQueryWithTransaction(sql, params, false);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}