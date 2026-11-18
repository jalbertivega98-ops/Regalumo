export type Collection =
  | "projects"
  | "orders"
  | "promos"
  | "settings"
  | "errors"
  | "outbox"
  | "feedback"
  | "requests"
  | "customers";

export interface Store {
  get<T>(col: Collection, id: string): Promise<T | null>;
  put<T>(col: Collection, id: string, data: T): Promise<void>;
  del(col: Collection, id: string): Promise<void>;
  /** Devuelve los documentos más recientes primero. */
  list<T>(col: Collection, limit?: number): Promise<T[]>;
  /** Contador atómico (límites de uso, analítica agregada). */
  incr(key: string, by?: number): Promise<number>;
  counters(prefix: string): Promise<Record<string, number>>;
}

export interface FileStore {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  del(key: string): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
}
