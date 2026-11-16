import { handle, json } from "@/lib/http";
import { createProject, HttpError, publicProject } from "@/lib/projects";
import { isProductId } from "@/lib/products/catalog";
import { parseData } from "@/lib/products/schemas";
import { consume } from "@/lib/security/ratelimit";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";

export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  if (!isProductId(body.product)) throw new HttpError(400, "Producto no válido");
  await consume(req, "projects", config.limits.projectsPerIpDay);
  const data = parseData(body.product, body.data);
  const { project, token } = await createProject(body.product, data);
  await track("demo_start", { product: body.product });
  return json({ project: publicProject(project), token }, 201);
});
