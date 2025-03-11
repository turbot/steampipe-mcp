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
  }

  async getSchemaInfo(schemaName: string): Promise<SchemaInfo> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT 
           t.table_name, 
           t.table_type,
           pg_catalog.obj_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, 'pg_class') as description
         FROM information_schema.tables t
         WHERE t.table_schema = $1 
         AND t.table_schema NOT IN ('information_schema', 'pg_catalog')`,
        [schemaName]
      );

      if (result.rowCount === 0) {
        throw new Error(`Schema not found: ${schemaName}`);
      }

      return {
        schema: schemaName,
        tables: result.rows.map(row => ({
          name: row.table_name,
          type: row.table_type,
          description: row.description,
        })),
      };
    } finally {
      client.release();
    }
  }

  async getTableInfo(schemaName: string, tableName: string): Promise<TableInfo> {
    const client = await this.pool.connect();
    try {
      // First check if the schema exists
      const schemaResult = await client.query(
        `SELECT 1 
         FROM information_schema.schemata 
         WHERE schema_name = $1 
         AND schema_name NOT IN ('information_schema', 'pg_catalog')`,
        [schemaName]
      );

      if (schemaResult.rowCount === 0) {
        throw new Error(`Schema not found: ${schemaName}`);
      }

      // Get table info and columns
      const tableResult = await client.query(
        `SELECT pg_catalog.obj_description((quote_ident($1) || '.' || quote_ident($2))::regclass::oid, 'pg_class') as description`,
        [schemaName, tableName]
      );

      const columnResult = await client.query(
        `SELECT 
           c.column_name,
           c.data_type,
           pg_catalog.col_description((quote_ident($1) || '.' || quote_ident($2))::regclass::oid, c.ordinal_position) as description
         FROM information_schema.columns c
         WHERE c.table_schema = $1 AND c.table_name = $2
         ORDER BY c.ordinal_position`,
        [schemaName, tableName]
      );

      if (columnResult.rowCount === 0) {
        throw new Error(`Table not found: ${tableName} in schema ${schemaName}`);
      }

      return {
        schema: schemaName,
        table: tableName,
        description: tableResult.rows[0]?.description,
        columns: columnResult.rows.map(row => ({
          name: row.column_name,
          type: row.data_type,
          description: row.description,
        })),
      };
    } finally {
      client.release();
    }
  }

  private async executeQueryWithTransaction(sql: string, params?: any[], readOnly: boolean = true): Promise<any[]> {
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