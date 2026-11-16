import { getFiles, getStore } from "./store";
import { randomId, sha256, safeEqual } from "./security/tokens";
import type { ProductId } from "./products/catalog";

export interface Project<D = unknown> {
  id: string;
  product: ProductId;
  data: D;
  tokenHash: string;
  status: "draft" | "paid";
  orderId?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  rating?: number;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function createProject<D>(product: ProductId, data: D) {
  const id = randomId(9);
  const token = randomId(24);
  const now = new Date().toISOString();
  const project: Project<D> = {
    id,
    product,
    data,
    tokenHash: sha256(token),
    status: "draft",
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
  await getStore().put("projects", id, project);
  return { project, token };
}

export function tokenFrom(req: Request) {
  return req.headers.get("x-project-token") || new URL(req.url).searchParams.get("t") || "";
}

/** Carga un proyecto comprobando el token de edición (propiedad anónima). */
export async function loadOwned<D = unknown>(id: string, token: string): Promise<Project<D>> {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) throw new HttpError(404, "Proyecto no encontrado");
  const p = await getStore().get<Project<D>>("projects", id);
  if (!p) throw new HttpError(404, "Proyecto no encontrado");
  if (!token || !safeEqual(p.tokenHash, sha256(token))) throw new HttpError(403, "Sin acceso a este proyecto");
  return p;
}

export async function saveProject(p: Project) {
  p.updatedAt = new Date().toISOString();
  await getStore().put("projects", p.id, p);
}

/** Borra el proyecto y todos sus archivos (fotos, PDFs generados). */
export async function deleteProject(id: string) {
  await getFiles().delPrefix(`projects/${id}`);
  await getStore().del("projects", id);
}

/** Vista pública del proyecto para el editor (sin hash del token). */
export function publicProject(p: Project) {
  return { id: p.id, product: p.product, data: p.data, status: p.status, orderId: p.orderId, photos: p.photos };
}
