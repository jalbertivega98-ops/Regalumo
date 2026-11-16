import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modelo de caché clásico: páginas de marketing estáticas, rutas de proyecto dinámicas.
  cacheComponents: false,
  poweredByHeader: false,
  // Las fuentes del PDF se leen desde disco en las funciones del servidor.
  outputFileTracingIncludes: {
    "/api/**/*": ["./assets/fonts/**/*", "./assets/samples/**/*"],
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
