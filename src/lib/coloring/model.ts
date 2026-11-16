import { z } from "zod";

export const coloringSchema = z.object({
  title: z.string().max(50).default(""),
  dedication: z.string().max(120).default(""),
  style: z.enum(["infantil", "sencillo", "detallado"]).default("sencillo"),
  pages: z
    .array(z.object({ photoId: z.string().max(40), style: z.enum(["infantil", "sencillo", "detallado"]).optional() }))
    .max(12)
    .default([]),
});
export type ColoringData = z.infer<typeof coloringSchema>;
