interface D1Meta { changes: number; duration?: number; last_row_id?: number; rows_read?: number; rows_written?: number; }
interface D1Result<T = unknown> { success: boolean; meta: D1Meta; results?: T[]; }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T> & { results: T[] }>;
  run<T = unknown>(): Promise<D1Result<T>>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
interface R2HTTPMetadata { contentType?: string; contentLanguage?: string; contentDisposition?: string; contentEncoding?: string; cacheControl?: string; cacheExpiry?: Date; }
interface R2Object {
  body: ReadableStream<Uint8Array>;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}
interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream<Uint8Array> | ArrayBuffer | ArrayBufferView | Blob | string, options?: { httpMetadata?: R2HTTPMetadata; customMetadata?: Record<string, string> }): Promise<unknown>;
}
interface Fetcher { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>; }
