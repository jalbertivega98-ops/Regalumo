/** Opciones del escape room (ligero: se usa también en el navegador). */
export const AGES = {
  peques: "5 a 7 años",
  ninos: "8 a 11 años",
  jovenes: "12 a 15 años",
  adultos: "Adultos y familias",
} as const;
export type AgeId = keyof typeof AGES;

export const DIFFICULTIES = { facil: "Fácil", media: "Media", dificil: "Difícil" } as const;
export type Difficulty = keyof typeof DIFFICULTIES;

export const DURATIONS = [30, 45, 60, 90] as const;


export function puzzleCount(input: { duration: number; difficulty: Difficulty }) {
  const base = ({ 30: 4, 45: 5, 60: 6, 90: 8 } as Record<number, number>)[input.duration] ?? 6;
  return Math.min(9, base + (input.difficulty === "dificil" ? 1 : 0));
}

export const THEME_OPTIONS = [
  { id: "piratas", name: "Piratas", emoji: "🏴‍☠️" },
  { id: "espacio", name: "Espacio", emoji: "🚀" },
  { id: "detectives", name: "Detectives", emoji: "🔎" },
  { id: "magia", name: "Magia", emoji: "🪄" },
  { id: "selva", name: "Selva", emoji: "🌿" },
  { id: "museo", name: "Misterio en el museo", emoji: "🏛️" },
  { id: "navidad", name: "Navidad", emoji: "🎄" },
] as const;
