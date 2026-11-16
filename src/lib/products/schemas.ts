import { newspaperSchema } from "../newspaper/model";
import { escapeSchema } from "../escape/generator";
import { coloringSchema } from "../coloring/model";
import type { ProductId } from "./catalog";
import { HttpError } from "../projects";

export const SCHEMAS = { newspaper: newspaperSchema, escape: escapeSchema, coloring: coloringSchema } as const;

export function parseData(product: ProductId, raw: unknown) {
  const r = SCHEMAS[product].safeParse(raw ?? {});
  if (!r.success) throw new HttpError(400, "Datos no válidos: revisa la longitud de los textos.");
  return r.data;
}
