declare module 'duckdb' {
  interface DatabaseOptions {
    access_mode?: 'READ_ONLY' | 'READ_WRITE';
  }

  class Database {
    constructor(path: string, options?: DatabaseOptions);
    connect(): Connection;
    close(callback: (err: Error | null) => void): void;
  }

  interface Connection {
    all(sql: string, paramsOrCallback: any[] | ((err: Error | null, rows: any[]) => void), callback?: (err: Error | null, rows: any[]) => void): void;
    run(sql: string, paramsOrCallback: any[] | ((err: Error | null) => void), callback?: (err: Error | null) => void): void;
    close(): void;
  }

  interface Statement {
    all(params: any[], callback: (err: Error | null, rows: any[]) => void): void;
    run(params: any[], callback: (err: Error | null) => void): void;
    finalize(callback: (err: Error | null) => void): void;
  }

  export { Database, Connection, Statement };
} 