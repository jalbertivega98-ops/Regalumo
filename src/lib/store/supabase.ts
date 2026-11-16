import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";
import type { Collection, FileStore, Store } from "./types";

/**
 * Driver de producción sobre Supabase (Postgres + Storage privado).
 * Esquema en supabase/schema.sql. Solo se usa en el servidor con la service role key;
 * las tablas tienen RLS activado sin políticas públicas, así que el navegador no puede leerlas.
 */
let client: SupabaseClient | null = null;
function sb() {
  client ??= createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { persistSession: false },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error("Supabase: " + res.error.message);
  return res.data;
}

export const supabaseStore: Store = {
  async get<T>(col: Collection, id: string) {
    const data = check(
      await sb().from("documents").select("data").eq("collection", col).eq("id", id).maybeSingle(),
    );
    return (data?.data as T) ?? null;
  },
  async put<T>(col: Collection, id: string, data: T) {
    check(
      await sb()
        .from("documents")
        .upsert({ collection: col, id, data, updated_at: new Date().toISOString() }),
    );
  },
  async del(col: Collection, id: string) {
    check(await sb().from("documents").delete().eq("collection", col).eq("id", id));
  },
  async list<T>(col: Collection, limit = 500) {
    const data = check(
      await sb()
        .from("documents")
        .select("data")
        .eq("collection", col)
        .order("updated_at", { ascending: false })
        .limit(limit),
    );
    return (data ?? []).map((r) => r.data as T);
  },
  async incr(key: string, by = 1) {
    const data = check(await sb().rpc("increment_counter", { p_key: key, p_by: by }));
    return Number(data);
  },
  async counters(prefix: string) {
    const data = check(await sb().from("counters").select("key,value").like("key", prefix + "%"));
    return Object.fromEntries((data ?? []).map((r) => [r.key as string, Number(r.value)]));
  },
};

export const supabaseFiles: FileStore = {
  async put(key, data, contentType) {
    check(
      await sb().storage.from(config.supabase.bucket).upload(key, data, { contentType, upsert: true }),
    );
  },
  async get(key) {
    const res = await sb().storage.from(config.supabase.bucket).download(key);
    if (res.error || !res.data) return null;
    return { data: Buffer.from(await res.data.arrayBuffer()), contentType: res.data.type };
  },
  async del(key) {
    check(await sb().storage.from(config.supabase.bucket).remove([key]));
  },
  async delPrefix(prefix) {
    const bucket = sb().storage.from(config.supabase.bucket);
    const listed = check(await bucket.list(prefix, { limit: 1000 }));
    const paths = (listed ?? []).map((f) => `${prefix}/${f.name}`);
    if (paths.length) check(await bucket.remove(paths));
  },
};
