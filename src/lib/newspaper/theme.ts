import type { TemplateId } from "./model";

/** Tokens visuales compartidos por la vista previa HTML y el PDF. Unidades: pt (= px en la vista previa). */
export const PAGE = { width: 842, height: 1191, margin: 34 };

export interface PaperTheme {
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  rule: string;
  mast: { family: string; weight: number; style: "normal" | "italic"; css: string };
  head: { family: string; weight: number; css: string };
  body: { family: string; css: string };
  photo: "grayscale" | "color" | "sepia";
}

export const THEMES: Record<TemplateId, PaperTheme> = {
  clasico: {
    paper: "#F6F1E4",
    ink: "#141414",
    muted: "#4A4740",
    accent: "#141414",
    rule: "#141414",
    mast: { family: "Unifraktur", weight: 400, style: "normal", css: "'UnifrakturMaguntia', serif" },
    head: { family: "Playfair", weight: 900, css: "'Playfair Display', serif" },
    body: { family: "OldStandard", css: "'Old Standard TT', serif" },
    photo: "grayscale",
  },
  moderno: {
    paper: "#FFFFFF",
    ink: "#1B1530",
    muted: "#5B5670",
    accent: "#FF6B4A",
    rule: "#1B1530",
    mast: { family: "Fraunces", weight: 900, style: "normal", css: "'Fraunces', serif" },
    head: { family: "Fraunces", weight: 900, css: "'Fraunces', serif" },
    body: { family: "Inter", css: "'Inter', sans-serif" },
    photo: "color",
  },
  vintage: {
    paper: "#EEDFC0",
    ink: "#3A2816",
    muted: "#6B5236",
    accent: "#8A3B12",
    rule: "#5A3D20",
    mast: { family: "Playfair", weight: 400, style: "italic", css: "'Playfair Display', serif" },
    head: { family: "Playfair", weight: 700, css: "'Playfair Display', serif" },
    body: { family: "OldStandard", css: "'Old Standard TT', serif" },
    photo: "sepia",
  },
};

export function mastSize(name: string) {
  const l = name.length;
  if (l <= 14) return 86;
  if (l <= 20) return 70;
  if (l <= 28) return 56;
  return 44;
}

/** Cuerpo del artículo principal adaptado a la longitud. */
export function leadSize(text: string, wide: boolean) {
  const l = text.length;
  if (wide) return l > 800 ? 13 : 15;
  if (l > 900) return 10.5;
  if (l > 650) return 11.5;
  if (l > 400) return 12.5;
  return 14;
}

export function smallTextSize(text: string, base = 11) {
  return text.length > 320 ? base - 1.5 : text.length > 200 ? base - 0.5 : base;
}

/** Previsión del tiempo de broma: claramente lúdica, nunca dato real. */
export const WEATHER = "Cielos despejados con un 100 % de probabilidad de abrazos. Rachas de risas durante toda la jornada.";
