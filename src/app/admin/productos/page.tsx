import { getPrices } from "@/lib/settings";
import { PACK, PRODUCTS, PRODUCT_IDS } from "@/lib/products/catalog";
import { PricesForm } from "@/components/admin/AdminForms";
import { Table } from "@/components/admin/ui";
import { config } from "@/lib/config";

export default async function Productos() {
  const prices = await getPrices();
  const labels = { newspaper: PRODUCTS.newspaper.name, escape: PRODUCTS.escape.name, coloring: PRODUCTS.coloring.name, pack: PACK.name };
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black">Productos y precios</h1>
      <PricesForm initial={prices} labels={labels} />
      <p className="hint">Nota: los textos de las páginas SEO mencionan los precios de lanzamiento. Si los cambias, revisa también src/content/seo.ts.</p>
      <Table
        head={["Producto", "Editor", "Generación", "Coste variable estimado", "Límite de prueba gratis por IP/día"]}
        rows={PRODUCT_IDS.map((p) => [
          PRODUCTS[p].name,
          PRODUCTS[p].editorPath,
          p === "coloring" ? "Algoritmo propio (sharp), sin API externa" : "Plantillas deterministas, sin API externa",
          `${PRODUCTS[p].estimatedCostEur} € / generación`,
          p === "coloring" ? config.limits.coloringPreviewsPerIpDay : p === "escape" ? config.limits.escapeDemosPerIpDay : `${config.limits.projectsPerIpDay} proyectos`,
        ])}
      />
      <div className="card p-5 text-sm">
        <p className="font-bold">Estilo «ilustración con IA» del libro para colorear</p>
        <p className="mt-1">{config.imageAi.provider ? `Proveedor configurado: ${config.imageAi.provider}` : "Pendiente: no hay API de imágenes configurada (IMAGE_AI_PROVIDER / IMAGE_AI_API_KEY). La web lo muestra como función pendiente."}</p>
      </div>
    </div>
  );
}
