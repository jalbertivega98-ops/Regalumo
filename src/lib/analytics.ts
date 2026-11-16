import { getStore } from "./store";
import { today } from "./security/ratelimit";

/**
 * Analítica propia y respetuosa con la privacidad: solo contadores agregados por día.
 * Sin cookies, sin identificadores personales y sin terceros.
 */
export const EVENTS = [
  "pageview",
  "session",
  "demo_start",
  "demo_complete",
  "preview",
  "upload",
  "checkout_start",
  "purchase",
  "revenue_cents",
  "rating",
  "free_generation",
  "free_cost_microeur",
] as const;
export type EventName = (typeof EVENTS)[number];

export async function track(event: EventName, opts: { product?: string; by?: number; day?: string } = {}) {
  const store = getStore();
  const day = opts.day ?? today();
  const by = opts.by ?? 1;
  try {
    await store.incr(`stat:${day}:${event}`, by);
    if (opts.product) await store.incr(`stat:${day}:${event}:${opts.product}`, by);
  } catch (e) {
    console.error("[analytics]", e);
  }
}

export async function statsSince(days: number) {
  const all = await getStore().counters("stat:");
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const totals: Record<string, number> = {};
  const byDay: Record<string, Record<string, number>> = {};
  for (const [k, v] of Object.entries(all)) {
    const [, day, ...rest] = k.split(":");
    if (day < from) continue;
    const key = rest.join(":");
    totals[key] = (totals[key] ?? 0) + v;
    (byDay[day] ??= {})[key] = v;
  }
  return { totals, byDay };
}
