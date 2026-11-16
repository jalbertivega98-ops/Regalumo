import { config } from "../config";
import { getStore } from "../store";
import { sha256 } from "./tokens";

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** IP anonimizada: hash con sal diaria, nunca se guarda la IP en claro. */
export function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "local";
  return sha256(config.secret + today() + ip).slice(0, 24);
}

export class LimitError extends Error {
  status = 429;
}

/**
 * Consume una unidad de cuota. Lanza LimitError si se supera el límite por cliente
 * o el tope global diario de generaciones gratuitas.
 */
export async function consume(req: Request, bucket: string, perClientLimit: number, opts: { global?: boolean } = {}) {
  const store = getStore();
  const day = today();
  const n = await store.incr(`rl:${day}:${bucket}:${clientKey(req)}`);
  if (n > perClientLimit) {
    throw new LimitError("Has alcanzado el límite gratuito de hoy. Vuelve mañana o desbloquea el producto completo.");
  }
  if (opts.global) {
    const g = await store.incr(`rl:${day}:global-free`);
    if (g > config.limits.globalFreeGenerationsDay) {
      throw new LimitError("Hoy hay mucha demanda de pruebas gratuitas. Inténtalo de nuevo mañana.");
    }
  }
}
