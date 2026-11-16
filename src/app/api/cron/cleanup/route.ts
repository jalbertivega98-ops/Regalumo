import { config } from "@/lib/config";
import { deleteProject, type Project } from "@/lib/projects";
import { getStore } from "@/lib/store";
import { json } from "@/lib/http";

/**
 * Borrado automático (minimización de datos): proyectos sin pagar y sus fotos
 * tras RETENTION_UNPAID_DAYS; proyectos pagados tras RETENTION_PAID_DAYS.
 * Programado en vercel.json. Protegido con CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("No autorizado", { status: 401 });
  const now = Date.now();
  let deleted = 0;
  for (const p of await getStore().list<Project>("projects", 5000)) {
    const age = (now - Date.parse(p.updatedAt)) / 86400000;
    const limit = p.status === "paid" ? config.retention.paidDays : config.retention.unpaidDays;
    if (age > limit) {
      await deleteProject(p.id);
      deleted++;
    }
  }
  return json({ deleted });
}
