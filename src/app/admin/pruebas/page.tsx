import { statsSince } from "@/lib/analytics";
import { Table } from "@/components/admin/ui";
import { config } from "@/lib/config";

export default async function Pruebas() {
  const { byDay } = await statsSince(30);
  const days = Object.keys(byDay).sort().reverse();
  const g = (d: string, k: string) => byDay[d]?.[k] ?? 0;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Uso de pruebas gratuitas (30 días)</h1>
      <p className="hint">
        Límites activos: {config.limits.projectsPerIpDay} proyectos, {config.limits.uploadsPerIpDay} fotos, {config.limits.coloringPreviewsPerIpDay} muestras de colorear y {config.limits.escapeDemosPerIpDay} demos de escape room por persona y día; tope global de {config.limits.globalFreeGenerationsDay} generaciones gratuitas al día. Las IP se guardan cifradas con sal diaria.
      </p>
      <Table
        head={["Día", "Sesiones", "Pruebas periódico", "Demos escape", "Proyectos colorear", "Muestras colorear", "Demos escape completadas", "Valoraciones"]}
        rows={days.map((d) => [
          d,
          g(d, "session"),
          g(d, "demo_start:newspaper"),
          g(d, "demo_start:escape"),
          g(d, "demo_start:coloring"),
          g(d, "free_generation:coloring"),
          g(d, "demo_complete:escape"),
          g(d, "rating"),
        ])}
      />
    </div>
  );
}
