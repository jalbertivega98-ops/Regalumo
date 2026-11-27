/**
 * Demo gratuita del escape room: tres retos que se juegan con el dedo y están
 * conectados. Cada uno da una cifra y el último es un candado que se abre con
 * esas cifras en el orden que indica una nota.
 */
import { escapeSchema, hash, heroPhrase, makeRng, type EscapeInput } from "./generator";
import { THEMES, type ThemeId } from "./themes";
import { PALETTES, type EscapePalette } from "./style";

interface DemoTheme {
  /** Nombre de la imagen rota, con artículo («el mapa»). */
  image: string;
  imageTitle: string;
  imageEmoji: string;
  target: { emoji: string; name: string; fem: boolean };
  scene: string;
  decor: string[];
  extra: { emoji: string; name: string };
}

export const DEMO_THEMES: Record<ThemeId, DemoTheme> = {
  piratas: { image: "el mapa", imageTitle: "El mapa roto", imageEmoji: "🏴‍☠️", target: { emoji: "🪙", name: "monedas", fem: true }, scene: "el camarote", decor: ["⚓", "🦜", "🗺️", "🧭", "🛢️", "🥾", "🧰", "🕯️"], extra: { emoji: "⚓", name: "anclas" } },
  espacio: { image: "la foto del telescopio", imageTitle: "La foto rota", imageEmoji: "🔭", target: { emoji: "👽", name: "extraterrestres", fem: false }, scene: "la nave", decor: ["🚀", "🛰️", "🪐", "🌙", "☄️", "👨‍🚀", "🔭", "🌍"], extra: { emoji: "⭐", name: "estrellas" } },
  detectives: { image: "la foto de la escena", imageTitle: "La foto rota", imageEmoji: "🕵️", target: { emoji: "🔑", name: "llaves", fem: true }, scene: "el despacho", decor: ["🔍", "🎩", "📰", "☕", "🔦", "🧳", "🕰️", "📷"], extra: { emoji: "👣", name: "huellas" } },
  magia: { image: "el pergamino", imageTitle: "El pergamino roto", imageEmoji: "🔮", target: { emoji: "🧪", name: "pociones", fem: true }, scene: "el aula de hechizos", decor: ["🪄", "📚", "🦉", "🕯️", "🧙", "🍄", "🐈‍⬛", "🎩"], extra: { emoji: "✨", name: "destellos" } },
  selva: { image: "el mapa de la expedición", imageTitle: "El mapa roto", imageEmoji: "🌿", target: { emoji: "🐸", name: "ranas", fem: true }, scene: "el campamento", decor: ["🌴", "🦜", "🐒", "🌺", "🍌", "🪨", "🐍", "🦋"], extra: { emoji: "🐾", name: "huellas" } },
  museo: { image: "el cuadro", imageTitle: "El cuadro roto", imageEmoji: "🖼️", target: { emoji: "💎", name: "diamantes", fem: false }, scene: "la sala de exposiciones", decor: ["🏺", "🗿", "👑", "🕯️", "🔦", "🎨", "🦖", "🪔"], extra: { emoji: "🔑", name: "llaves" } },
  navidad: { image: "la postal", imageTitle: "La postal rota", imageEmoji: "🎄", target: { emoji: "🔔", name: "campanas", fem: true }, scene: "el salón", decor: ["🎄", "⛄", "🧦", "🕯️", "🍪", "🎅", "🦌", "🎁"], extra: { emoji: "⭐", name: "estrellas" } },
};

/** Posición en % de la escena. «behind»: asoma por detrás de otro objeto. */
export interface SeekItem { emoji: string; x: number; y: number; size: number; target: boolean; behind?: boolean }

export type DemoStep =
  | { kind: "slide"; title: string; chapter: string; instructions: string; order: number[]; digit: number; emoji: string; decor: string[]; hints: string[] }
  | { kind: "seek"; title: string; chapter: string; instructions: string; target: DemoTheme["target"]; items: SeekItem[]; digit: number; hints: string[] }
  | { kind: "lock"; title: string; chapter: string; instructions: string; note: string };

export interface EscapeDemo {
  title: string;
  intro: string;
  themeName: string;
  prize: string;
  palette: EscapePalette;
  steps: [DemoStep, DemoStep, DemoStep];
  /** Solo en el servidor: combinación del candado y sus pistas. */
  code: string;
  lockHints: string[];
  ending: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** «de el cofre» → «del cofre». */
const de = (s: string) => (s.startsWith("el ") ? `del ${s.slice(3)}` : `de ${s}`);

/** Desordena las piezas sin dejar el centro (la cifra) en su sitio y con al menos 6 fuera de lugar. */
function scramble(rng: ReturnType<typeof makeRng>, n: number) {
  const ids = Array.from({ length: n }, (_, i) => i);
  for (;;) {
    const o = rng.shuffle(ids);
    const wrong = o.filter((v, i) => v !== i).length;
    if (o[Math.floor(n / 2)] !== Math.floor(n / 2) && wrong >= Math.min(n, 6)) return o;
  }
}

/**
 * Reparte los objetos de la escena en una cuadrícula para que no se tapen.
 * Con «hide», algunos objetivos asoman por detrás de un objeto grande.
 */
function scatter(rng: ReturnType<typeof makeRng>, decor: string[], target: string, count: number, small: number, hide: number): SeekItem[] {
  const cols = 6, rows = 4;
  const cells = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i));
  const items: SeekItem[] = [];
  const put = (emoji: string, size: number, isTarget: boolean) => {
    const c = cells.pop()!;
    const x = ((c % cols) + 0.3 + rng.next() * 0.4) / cols;
    const y = (Math.floor(c / cols) + 0.3 + rng.next() * 0.4) / rows;
    const it = { emoji, x: Math.round(x * 1000) / 10, y: Math.round(y * 1000) / 10, size, target: isTarget };
    items.push(it);
    return it;
  };
  const big = rng.shuffle(decor).slice(0, 8).map((d) => put(d, rng.int(36, 46), false));
  const hosts = rng.shuffle(big);
  for (let i = 0; i < count; i++) {
    const size = small + rng.int(0, 3);
    if (i < hide) {
      // Asoma por una esquina del objeto grande (que se dibuja encima).
      const h = hosts[i];
      const dx = (rng.next() < 0.5 ? -1 : 1) * 4.2;
      const dy = (rng.next() < 0.5 ? -1 : 1) * 4.5;
      items.push({ emoji: target, x: Math.round((h.x + dx) * 10) / 10, y: Math.round((h.y + dy) * 10) / 10, size, target: true, behind: true });
    } else put(target, size, true);
  }
  return items;
}

export function generateDemo(raw: unknown): EscapeDemo {
  const input: EscapeInput = escapeSchema.parse(raw);
  const theme = THEMES[input.theme];
  const t = DEMO_THEMES[input.theme];
  const rng = makeRng(hash(JSON.stringify(input) + "demo2"));
  const peques = input.age === "peques";
  const guardian = cap(theme.guardian);

  // Tres cifras distintas para que la nota no sea ambigua.
  const d1 = rng.int(1, 9);
  let d2 = rng.int(peques ? 3 : 4, peques ? 5 : 7);
  while (d2 === d1) d2 = rng.int(3, 7);
  let d3 = rng.int(1, 3);
  while (d3 === d1 || d3 === d2) d3 = rng.int(1, 4);

  const parts = [
    { key: "img", label: `el número ${de(t.image)}`, digit: d1 },
    { key: "seek", label: `${t.target.fem ? "cuántas" : "cuántos"} ${t.target.name} encontrasteis`, digit: d2 },
    { key: "extra", label: `${t.extra.name === "destellos" ? "cuántos" : "cuántas"} ${t.extra.name} hay en esta nota: ${Array(d3).fill(t.extra.emoji).join(" ")}`, digit: d3 },
  ];
  const order = peques ? parts : rng.shuffle(parts);
  const note = `«Primero, ${order[0].label}. Después, ${order[1].label}. Y al final, ${order[2].label}.»`;
  const code = order.map((p) => p.digit).join("");

  const it = t.target.fem ? "una" : "uno";
  const all = t.target.fem ? "todas" : "todos";
  const steps: EscapeDemo["steps"] = [
    {
      kind: "slide",
      title: t.imageTitle,
      chapter: theme.chapters[0],
      instructions: `${guardian} ha roto ${t.image} en ${peques ? 4 : 9} trozos. Tocad dos piezas para cambiarlas de sitio. Cuando esté entero, veréis la primera cifra del candado.`,
      order: scramble(rng, peques ? 4 : 9),
      digit: d1,
      emoji: t.imageEmoji,
      decor: t.decor.slice(0, 4),
      hints: ["Empezad por las esquinas: son las piezas que tienen marco por dos lados.", "El dibujo grande del centro es un número. Juntad sus trozos."],
    },
    {
      kind: "seek",
      title: `¿${t.target.fem ? "Cuántas" : "Cuántos"} ${t.target.name}?`,
      chapter: theme.chapters[1],
      instructions: `${guardian} ha escondido ${t.target.name} por ${t.scene}. Tocad cada ${it} que encontréis y, cuando creáis que están ${all}, pulsad el botón.`,
      target: t.target,
      items: scatter(rng, t.decor, t.target.emoji, d2, peques ? 24 : 17, peques ? 0 : Math.min(d2, input.age === "ninos" ? 2 : 3)),
      digit: d2,
      hints: [`Son pequeñ${t.target.fem ? "as" : "os"}: mirad junto a los objetos grandes y por los bordes.`, `Hay ${d2} en total.`],
    },
    {
      kind: "lock",
      title: `El candado ${de(theme.prize)}`,
      chapter: theme.chapters[2],
      instructions: `Girad las ruedas. Cada cifra la habéis ganado en un reto, pero el orden lo dice esta nota ${de(theme.guardian)}:`,
      note,
    },
  ];

  return {
    title: input.hero.trim() ? `${theme.title}: la aventura de ${input.hero.trim()}` : theme.title,
    intro: theme.intro.replace("{heroe_frase}", heroPhrase(input)),
    themeName: theme.name,
    prize: theme.prize,
    palette: PALETTES[input.theme],
    steps,
    code,
    lockHints: [`Primera rueda: ${order[0].label.replace(/: .*/, "")}.`, `La combinación es ${code.split("").join(" - ")}.`],
    ending: theme.ending,
  };
}

/** Lo que se envía al navegador (sin la combinación ni sus pistas). */
export function publicDemo(d: EscapeDemo) {
  return { title: d.title, intro: d.intro, themeName: d.themeName, prize: d.prize, palette: d.palette, steps: d.steps };
}
