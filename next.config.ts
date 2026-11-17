import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modelo de caché clásico: páginas de marketing estáticas, rutas de proyecto dinámicas.
  cacheComponents: false,
  poweredByHeader: false,
  // Las fuentes del PDF se leen desde disco en las funciones del servidor.
  outputFileTracingIncludes: {
    "/api/**/*": ["./assets/fonts/**/*", "./assets/samples/**/*", "./assets/models/**/*", "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1"],
  },
  // Motor ONNX nativo (separar sujeto y fondo en las láminas). Solo hace falta el binario de Linux x64.
  serverExternalPackages: ["onnxruntime-node"],
  outputFileTracingExcludes: {
    "/**/*": [
      "./node_modules/onnxruntime-node/bin/napi-v6/darwin/**",
      "./node_modules/onnxruntime-node/bin/napi-v6/win32/**",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_*",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  /**
   * Con dominio propio (NEXT_PUBLIC_SITE_URL), la dirección *.vercel.app de producción
   * redirige al dominio para que Google solo indexe una versión. /api queda fuera:
   * el webhook de Stripe y las descargas no deben recibir redirecciones.
   */
  async redirects() {
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (process.env.VERCEL_ENV !== "production" || !site || site.includes(".vercel.app")) return [];
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "(?<sub>.+)\\.vercel\\.app" }],
        destination: `${site}/:path`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Zonas privadas: nunca indexar.
        source: "/(crear|pedido|admin|api)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
