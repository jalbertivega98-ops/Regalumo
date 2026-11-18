import { promises as fs } from "fs";
import path from "path";
import type { Collection, FileStore, Store } from "./types";

/**
 * Almacén local en disco (.data/). Pensado para desarrollo y pruebas.
 * En producción (Vercel) el disco no persiste: usa el driver de Supabase.
 */
const ROOT = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data");
const DB_FILE = path.join(ROOT, "db.json");

type Row = { data: unknown; updatedAt: number };
type Db = { docs: Record<string, Record<string, Row>>; counters: Record<string, number> };

let cache: Db | null = null;
let cacheMtime = 0;
let chain: Promise<unknown> = Promise.resolve();

/**
 * Next.js puede cargar este módulo varias veces (páginas y rutas de API),
 * así que se vuelve a leer el archivo si otro proceso lo ha modificado.
 */
async function load(): Promise<Db> {
  let mtime = 0;
  try {
    mtime = (await fs.stat(DB_FILE)).mtimeMs;
  } catch {
    /* aún no existe */
  }
  if (cache && mtime === cacheMtime) return cache;
  try {
    cache = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db;
  } catch {
    cache = { docs: {}, counters: {} };
  }
  cacheMtime = mtime;
  return cache;
}

async function persist() {
  await fs.mkdir(ROOT, { recursive: true });
  const tmp = DB_FILE + "." + process.pid + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(cache));
  await fs.rename(tmp, DB_FILE);
  cacheMtime = (await fs.stat(DB_FILE)).mtimeMs;
}

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

export const localStore: Store = {
  async get<T>(col: Collection, id: string) {
    const db = await load();
    const row = db.docs[col]?.[id];
    return row ? (structuredClone(row.data) as T) : null;
  },
  put<T>(col: Collection, id: string, data: T) {
    return serial(async () => {
      const db = await load();
      db.docs[col] ??= {};
      db.docs[col][id] = { data: structuredClone(data), updatedAt: Date.now() };
      await persist();
    });
  },
  del(col: Collection, id: string) {
    return serial(async () => {
      const db = await load();
      if (db.docs[col]) delete db.docs[col][id];
      await persist();
    });
  },
  async list<T>(col: Collection, limit = 500) {
    const db = await load();
    return Object.values(db.docs[col] ?? {})
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map((r) => structuredClone(r.data) as T);
  },
  incr(key: string, by = 1) {
    return serial(async () => {
      const db = await load();
      db.counters[key] = (db.counters[key] ?? 0) + by;
      await persist();
      return db.counters[key];
    });
  },
  async counters(prefix: string, fromKey?: string) {
    const db = await load();
    return Object.fromEntries(Object.entries(db.counters).filter(([k]) => k.startsWith(prefix) && (!fromKey || k >= fromKey)));
  },
};

const FILES = path.join(ROOT, "files");

function safe(key: string) {
  const p = path.join(FILES, key);
  if (!p.startsWith(FILES + path.sep)) throw new Error("Ruta de archivo no válida");
  return p;
}

export const localFiles: FileStore = {
  async put(key, data, contentType) {
    const p = safe(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, data);
    await fs.writeFile(p + ".type", contentType);
  },
  async get(key) {
    try {
      const p = safe(key);
      const [data, contentType] = await Promise.all([fs.readFile(p), fs.readFile(p + ".type", "utf8")]);
      return { data, contentType };
    } catch {
      return null;
    }
  },
  async del(key) {
    const p = safe(key);
    await fs.rm(p, { force: true });
    await fs.rm(p + ".type", { force: true });
  },
  async delPrefix(prefix) {
    await fs.rm(safe(prefix), { recursive: true, force: true });
  },
};
