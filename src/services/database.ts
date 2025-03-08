import pg from "pg";
import { SchemaInfo, TableInfo } from "../types/index.js";

export class DatabaseService {
  private pool: pg.Pool;

  constructor(databaseUrl: string) {
    // Parse the URL to check if it's a Turbot Pipes URL
    const url = new URL(databaseUrl);
    const isTurbotPipes = url.hostname.endsWith('.steampipe.cloud');

    this.pool = new pg.Pool({
      connectionString: databaseUrl,
      // Enable SSL for Turbot Pipes or if explicitly requested in URL params
      ssl: isTurbotPipes || url.searchParams.has('sslmode') ? {
        rejectUnauthorized: true,
      } : undefined,
    });
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

  async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN TRANSACTION READ ONLY");
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client
        .query("ROLLBACK")
        .catch((error) =>
          console.warn("Could not roll back transaction:", error),
        );
      client.release();
    }
  }

  async executeWriteQuery(sql: string, params?: any[]): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}