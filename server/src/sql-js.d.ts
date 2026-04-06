/**
 * sql.js ships JS without bundled types; keep declarations aligned with usage in db.ts.
 */
declare module "sql.js" {
  export interface Statement {
    bind(params?: unknown): void;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  export interface Database {
    run(sql: string, params?: unknown): void;
    exec(sql: string): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayBuffer | Uint8Array | Buffer) => Database;
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
  }): Promise<SqlJsStatic>;
}
