import type { ThemeId } from "./themes";

/** Motivo decorativo de cada temática (se dibuja con formas vectoriales, sin imágenes). */
export type Motif = "wave" | "star" | "print" | "sparkle" | "leaf" | "diamond" | "snow";

export interface EscapePalette {
  /** Texto y líneas. */
  ink: string;
  /** Color principal de la temática (títulos, etiquetas). */
  accent: string;
  /** Segundo color para adornos. */
  accent2: string;
  /** Fondo suave de las cajas. */
  soft: string;
  muted: string;
  /** Fondo de la portada. */
  cover: string;
  /** Texto destacado sobre la portada. */
  coverAccent: string;
  motif: Motif;
}

/** Paletas pensadas para imprimir bien en casa (contraste alto, fondos claros salvo la portada). */
export const PALETTES: Record<ThemeId, EscapePalette> = {
  piratas: { ink: "#2B1D0E", accent: "#9A4A1C", accent2: "#C9932B", soft: "#F6ECD9", muted: "#6B5A45", cover: "#1F2D3A", coverAccent: "#E8C36A", motif: "wave" },
  espacio: { ink: "#101633", accent: "#3451C7", accent2: "#E0A526", soft: "#E9EEFF", muted: "#55607F", cover: "#0B1030", coverAccent: "#FFD166", motif: "star" },
  detectives: { ink: "#1F2328", accent: "#A63A36", accent2: "#7A6A55", soft: "#F2EEE7", muted: "#5D5A55", cover: "#22262B", coverAccent: "#F2C14E", motif: "print" },
  magia: { ink: "#26113D", accent: "#7B3FC4", accent2: "#D4A017", soft: "#F3EAFF", muted: "#62557A", cover: "#2A1147", coverAccent: "#F5D06F", motif: "sparkle" },
  selva: { ink: "#13301F", accent: "#2A7D46", accent2: "#E08A1E", soft: "#E8F5EA", muted: "#4F6656", cover: "#103A22", coverAccent: "#FFC857", motif: "leaf" },
  museo: { ink: "#2B0F16", accent: "#8C1C2E", accent2: "#B8892B", soft: "#F7EEE4", muted: "#6A5558", cover: "#3A0F1B", coverAccent: "#E9C46A", motif: "diamond" },
  navidad: { ink: "#1C2A22", accent: "#B3261E", accent2: "#1E7A4A", soft: "#FCF1E6", muted: "#5C6660", cover: "#14452D", coverAccent: "#F4C542", motif: "snow" },
};
