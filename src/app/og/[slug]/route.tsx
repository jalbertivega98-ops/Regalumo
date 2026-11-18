import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SEO_PAGES, getSeoPage } from "@/content/seo";
import { PRODUCTS } from "@/lib/products/catalog";

/**
 * Imagen para compartir (WhatsApp, Facebook, X…) de cada página de aterrizaje: /og/<slug>.
 * Es una ruta propia con dirección fija (no «opengraph-image», que añade un sufijo
 * aleatorio) para poder citarla también en los datos estructurados del producto.
 */
const size = { width: 1200, height: 630 };
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.slug }));
}

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const page = getSeoPage((await params).slug);
  if (!page) return new Response("No encontrado", { status: 404 });
  const accent = page.product !== "all" ? PRODUCTS[page.product].accent : "#FF6B4A";
  const [display, body, icon] = await Promise.all([
    font("fraunces-latin-900-normal.woff"),
    font("inter-latin-800-normal.woff"),
    readFile(join(process.cwd(), "public/icon.svg")),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFF8EF", padding: 70, color: "#1E1633", fontFamily: "Inter" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 44, fontWeight: 800 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" width={64} height={64} src={`data:image/svg+xml;base64,${icon.toString("base64")}`} />
          regalumo
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: accent }}>{page.eyebrow}</div>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 68, lineHeight: 1.08 }}>{page.h1}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30 }}>
          <span style={{ background: accent, color: "white", padding: "10px 24px", borderRadius: 999 }}>Pruébalo gratis</span>
          <span style={{ color: "#5B5270" }}>Sin registro · PDF al momento</span>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
      fonts: [
        { name: "Fraunces", data: display, weight: 900, style: "normal" },
        { name: "Inter", data: body, weight: 800, style: "normal" },
      ],
    },
  );
}
