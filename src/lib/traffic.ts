/**
 * Origen de las visitas y pasos del embudo. Módulo puro: lo usan el navegador y el servidor.
 * Solo se manejan categorías («google», «tiktok»…), nunca la URL completa de la que viene nadie.
 */

export const SOURCES = {
  directo: "Directo / sin datos",
  google: "Google",
  buscadores: "Otros buscadores",
  ia: "Asistentes de IA",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  youtube: "YouTube",
  x: "X (Twitter)",
  email: "Correo",
  blogs: "Otras webs",
  campana: "Otras campañas (utm)",
} as const;
export type SourceId = keyof typeof SOURCES;
export const isSource = (s: unknown): s is SourceId => typeof s === "string" && Object.hasOwn(SOURCES, s);

/** Dominios (o el final del dominio) de cada origen. */
const HOSTS: [RegExp, SourceId][] = [
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|ecosia\.org|qwant\.com|startpage\.com|brave\.com|yandex\.[a-z.]+)$/, "buscadores"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/, "ia"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, "pinterest"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)(whatsapp\.com|whatsapp\.net|wa\.me)$/, "whatsapp"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, "telegram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com)$/, "email"],
];

/** Valores habituales de utm_source y su origen. */
const UTM: Record<string, SourceId> = {
  google: "google",
  tiktok: "tiktok",
  tt: "tiktok",
  pinterest: "pinterest",
  pin: "pinterest",
  instagram: "instagram",
  ig: "instagram",
  facebook: "facebook",
  fb: "facebook",
  whatsapp: "whatsapp",
  wa: "whatsapp",
  telegram: "telegram",
  youtube: "youtube",
  yt: "youtube",
  twitter: "x",
  x: "x",
  email: "email",
  mail: "email",
  newsletter: "email",
  chatgpt: "ia",
};

/** Clasifica una visita por su `utm_source` (si lo hay) o por el dominio del que llega. */
export function classifySource(opts: { utmSource?: string | null; referrerHost?: string | null; ownHost?: string | null }): SourceId {
  const utm = (opts.utmSource ?? "").trim().toLowerCase();
  if (utm) return UTM[utm] ?? (isSource(utm) ? utm : "campana");
  const host = (opts.referrerHost ?? "").trim().toLowerCase().replace(/^www\./, "");
  if (!host) return "directo";
  const own = (opts.ownHost ?? "").toLowerCase().replace(/^www\./, "");
  // Pestaña nueva abierta desde la propia web o vuelta desde la pasarela de pago.
  if (host === own || host.endsWith(".stripe.com") || host === "stripe.com") return "directo";
  for (const [re, id] of HOSTS) if (re.test(host)) return id;
  return "blogs";
}

/** Nombre de campaña (utm_campaign) limpio y corto, o "" si no hay. */
export function cleanCampaign(c: unknown) {
  if (typeof c !== "string") return "";
  return c
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Pasos del embudo, en orden. «Visita» es la sesión. */
export const FUNNEL = [
  ["visit", "Entra en la web"],
  ["open", "Abre un producto"],
  ["preview", "Ve su muestra gratis"],
  ["checkout", "Va a pagar"],
  ["paid", "Paga"],
] as const;
export type FunnelStep = (typeof FUNNEL)[number][0];
/** Pasos que avisa el navegador (la compra la registra el servidor al confirmar el pago). */
export const CLIENT_STEPS = ["open", "preview", "upload", "checkout"] as const;
export type ClientStep = (typeof CLIENT_STEPS)[number];
export const isClientStep = (s: unknown): s is ClientStep => typeof s === "string" && (CLIENT_STEPS as readonly string[]).includes(s);

/** Producto según la ruta del editor (mismas rutas que `editorPath` del catálogo). */
export const EDITOR_PATHS = {
  "/crear/periodico": "newspaper",
  "/crear/escape-room": "escape",
  "/crear/libro-colorear": "coloring",
} as const;

const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|curl|wget|python|node-fetch|axios/i;
/** Robots y vistas previas de enlaces: no cuentan como visitas. */
export const isBot = (ua: string | null) => !ua || BOTS.test(ua);
export const isMobile = (ua: string | null) => !!ua && /mobi|android|iphone|ipad|ipod/i.test(ua);
