/**
 * Configuración central. Todo lo que cuesta dinero o protege al negocio se
 * controla desde variables de entorno con valores por defecto prudentes.
 */
function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  siteName: "REGALUMO",
  slogan: "Crea algo único. Sorprende a alguien especial.",
  contactEmail: process.env.CONTACT_EMAIL || "hola@regalumo.example",

  /** Secreto para firmar tokens (descargas, sesiones de admin, estados de demo). */
  secret: process.env.APP_SECRET || "dev-only-secret-change-me",
  adminPassword: process.env.ADMIN_PASSWORD || "",

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    /** Cobros reales bloqueados salvo autorización explícita (ALLOW_LIVE_PAYMENTS=true). */
    allowLive: process.env.ALLOW_LIVE_PAYMENTS === "true",
  },

  /**
   * Pago simulado SOLO para desarrollo local y pruebas automáticas.
   * Nunca se activa en producción, aunque alguien ponga la variable.
   */
  mockPayments:
    process.env.PAYMENTS_MODE === "mock" && process.env.NODE_ENV !== "production",

  email: {
    resendKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "REGALUMO <pedidos@regalumo.example>",
  },

  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    bucket: process.env.SUPABASE_BUCKET || "private",
  },

  /** API de imágenes por IA (estilo "ilustración"). Vacío = función pendiente. */
  imageAi: {
    provider: process.env.IMAGE_AI_PROVIDER || "",
    apiKey: process.env.IMAGE_AI_API_KEY || "",
  },

  limits: {
    /** Proyectos gratuitos que puede crear una misma IP al día. */
    projectsPerIpDay: num("LIMIT_PROJECTS_PER_IP_DAY", 25),
    /** Fotos subidas por IP y día. */
    uploadsPerIpDay: num("LIMIT_UPLOADS_PER_IP_DAY", 40),
    /** Previsualizaciones de colorear por IP y día. */
    coloringPreviewsPerIpDay: num("LIMIT_COLORING_PREVIEWS_PER_IP_DAY", 20),
    /** Demos de escape room por IP y día. */
    escapeDemosPerIpDay: num("LIMIT_ESCAPE_DEMOS_PER_IP_DAY", 30),
    /** Tope global diario de generaciones gratuitas (protección de costes). */
    globalFreeGenerationsDay: num("LIMIT_GLOBAL_FREE_GENERATIONS_DAY", 3000),
    /** Coste variable máximo diario permitido para generaciones gratuitas (EUR). */
    maxFreeCostEurDay: num("MAX_FREE_COST_EUR_DAY", 5),
    maxUploadBytes: num("MAX_UPLOAD_BYTES", 10 * 1024 * 1024),
    maxPhotosNewspaper: 4,
    maxPagesColoring: 12,
  },

  /** Días que se guardan los proyectos no pagados y sus fotos antes de borrarse. */
  retention: {
    unpaidDays: num("RETENTION_UNPAID_DAYS", 30),
    paidDays: num("RETENTION_PAID_DAYS", 365),
  },
};

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
