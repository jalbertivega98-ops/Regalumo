import { config, isProduction } from "../config";
import { localFiles, localStore } from "./local";
import { supabaseFiles, supabaseStore } from "./supabase";
import type { FileStore, Store } from "./types";

export type { Collection, Store, FileStore } from "./types";

export function storageDriver(): "supabase" | "local" {
  return config.supabase.url && config.supabase.serviceKey ? "supabase" : "local";
}

export function getStore(): Store {
  if (storageDriver() === "supabase") return supabaseStore;
  if (isProduction() && process.env.VERCEL) {
    throw new Error("Falta configurar Supabase: el disco de Vercel no conserva datos.");
  }
  return localStore;
}

export function getFiles(): FileStore {
  return storageDriver() === "supabase" ? supabaseFiles : localFiles;
}
