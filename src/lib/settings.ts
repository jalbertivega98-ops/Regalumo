import { getStore } from "./store";
import { PACK, PRODUCTS, type SkuId } from "./products/catalog";

export type Prices = Record<SkuId, number>;

export function defaultPrices(): Prices {
  return {
    newspaper: PRODUCTS.newspaper.defaultPriceCents,
    escape: PRODUCTS.escape.defaultPriceCents,
    coloring: PRODUCTS.coloring.defaultPriceCents,
    pack: PACK.defaultPriceCents,
  };
}

export async function getPrices(): Promise<Prices> {
  const saved = await getStore().get<Partial<Prices>>("settings", "prices");
  return { ...defaultPrices(), ...(saved ?? {}) };
}

export async function setPrices(p: Partial<Prices>) {
  const current = await getPrices();
  const next = { ...current };
  for (const k of Object.keys(current) as SkuId[]) {
    const v = p[k];
    if (typeof v === "number" && Number.isInteger(v) && v >= 50 && v <= 50000) next[k] = v;
  }
  await getStore().put("settings", "prices", next);
  return next;
}

export interface Promo {
  code: string;
  percentOff: number;
  active: boolean;
  maxUses?: number;
  uses: number;
  expiresAt?: string;
  createdAt: string;
}

export function normalizeCode(c: string) {
  return c.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
}

export async function findPromo(code: string): Promise<Promo | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  const p = await getStore().get<Promo>("promos", c);
  if (!p || !p.active) return null;
  if (p.expiresAt && Date.parse(p.expiresAt) < Date.now()) return null;
  if (p.maxUses && p.uses >= p.maxUses) return null;
  return p;
}
